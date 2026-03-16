import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

// MercadoPago SDK requiere runtime Node.js (no Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PackCreditos = {
  id: string;
  nombre: string;
  cantidad_creditos: number;
  precio_ars: number;
  descuento_porcentaje: number | null;
  popular: boolean | null;
  activo: boolean | null;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getMpAccessToken(): string {
  // Soporta ambos nombres por compatibilidad (tu código viejo usaba MP_ACCESS_TOKEN)
  return (
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MP_ACCESS_TOKEN ||
    ""
  );
}

function parseExternalReference(externalReference: string): {
  prestadorId: string | null;
  packId: string | null;
  transaccionId: string | null;
} {
  // Formato NUEVO (recomendado): credits:transaccionId:prestadorId:packId
  if (externalReference.includes(":")) {
    const parts = externalReference.split(":");
    if (parts.length >= 4 && parts[0] === "credits") {
      return {
        transaccionId: parts[1] || null,
        prestadorId: parts[2] || null,
        packId: parts[3] || null,
      };
    }
  }

  // Formato VIEJO: prestadorId-packId
  if (externalReference.includes("-")) {
    const [prestadorId, packId] = externalReference.split("-");
    return {
      transaccionId: null,
      prestadorId: prestadorId || null,
      packId: packId || null,
    };
  }

  return { prestadorId: null, packId: null, transaccionId: null };
}

export async function POST(request: NextRequest) {
  try {
    const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const mpAccessToken = getMpAccessToken();
    if (!mpAccessToken) {
      console.error("Missing MP access token (MERCADOPAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN)");
      // Respondemos 200 para que MP no reintente sin fin; pero logueamos el problema
      return NextResponse.json({ ok: true });
    }

    // Supabase Admin (sin tipado fuerte => evita `never`)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Body webhook
    const body = await request.json();
    console.log("MercadoPago webhook received:", body);

    // Validar tipo
    if (body?.type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body?.data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "payment_id no encontrado" }, { status: 400 });
    }

    // Obtener pago desde MP
    const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const paymentApi = new Payment(mpClient);

    const paymentData: any = await paymentApi.get({ id: paymentId });
    console.log("Payment data:", paymentData);

    // Procesar solo aprobados
    if (paymentData?.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    const externalReference = paymentData?.external_reference;
    if (!externalReference) {
      console.error("No external_reference found in payment");
      return NextResponse.json({ ok: true });
    }

    const { prestadorId, packId } = parseExternalReference(String(externalReference));
    if (!prestadorId || !packId) {
      console.error("external_reference inválida:", externalReference);
      return NextResponse.json({ ok: true });
    }

    // Buscar pack
    const { data: packData, error: packError } = await supabase
      .from("packs_creditos")
      .select("*")
      .eq("id", packId)
      .maybeSingle();

    if (packError) {
      console.error("Error buscando pack:", packError);
      return NextResponse.json({ ok: true });
    }

    const pack = packData as PackCreditos | null;
    if (!pack) {
      console.error("Pack no encontrado:", packId);
      return NextResponse.json({ ok: true });
    }

    if (pack.activo === false) {
      console.error("Pack inactivo:", packId);
      return NextResponse.json({ ok: true });
    }

    // Idempotencia: si ya existe transacción con este payment_id, no reprocesar
    const { data: existingTx, error: existingTxError } = await supabase
      .from("transacciones")
      .select("id")
      .eq("mp_payment_id", String(paymentId))
      .maybeSingle();

    if (existingTxError) {
      console.error("Error verificando transacción existente:", existingTxError);
      // igual respondemos ok para no provocar reintentos excesivos
      return NextResponse.json({ ok: true });
    }

    if (existingTx?.id) {
      console.log("Transaction already processed:", existingTx.id);
      return NextResponse.json({ ok: true });
    }

    // Crear/actualizar transacción (FIX: sin tipos strict; compila en Vercel)
    const txPayload = {
      prestador_id: prestadorId,
      tipo: "compra_creditos",
      monto_ars: Number(pack.precio_ars),
      creditos: Number(pack.cantidad_creditos),
      estado_pago: "aprobado",
      metodo_pago: "mercadopago",
      mp_payment_id: String(paymentId),
      // opcional (si lo querés guardar)
      mp_preference_id: paymentData?.preference_id ? String(paymentData.preference_id) : null,
    };

    const { data: transaction, error: transactionError } = await (supabase
      .from("transacciones") as any)
      .upsert(txPayload as any, { onConflict: "mp_payment_id" })
      .select("id")
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return NextResponse.json({ error: "Error al crear transacción" }, { status: 500 });
    }

    // Sumar créditos al usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("creditos_disponibles")
      .eq("id", prestadorId)
      .maybeSingle();

    if (usuarioError) {
      console.error("Error buscando usuario:", usuarioError);
      return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 });
    }

    if (!usuario) {
      console.error("Usuario no encontrado:", prestadorId);
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const currentCredits = Number((usuario as any).creditos_disponibles ?? 0);
    const creditsToAdd = Number(pack.cantidad_creditos ?? 0);

    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ creditos_disponibles: currentCredits + creditsToAdd })
      .eq("id", prestadorId);

    if (updateError) {
      console.error("Error updating credits:", updateError);
      return NextResponse.json({ error: "Error al actualizar créditos" }, { status: 500 });
    }

    console.log(`Credits added: ${creditsToAdd} to user ${prestadorId}. Tx: ${transaction?.id}`);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    // Importante: responder algo (ideal 200) para evitar reintentos infinitos si el error es de config.
    return NextResponse.json({ error: "Error al procesar webhook" }, { status: 500 });
  }
}
