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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

    // Supabase Admin (service role)
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

    /**
     * ✅ IMPORTANTÍSIMO (TEST):
     * Muchas veces llega primero action=payment.created, pero el recurso aún no está disponible
     * y Payment.get(id) devuelve 404 "Payment not found".
     * En ese caso, devolvemos 200 y esperamos el payment.updated.
     */
    if (body?.action === "payment.created") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body?.data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "payment_id no encontrado" }, { status: 400 });
    }

    // Obtener pago desde MP con retry (por consistencia eventual)
    const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const paymentApi = new Payment(mpClient);

    async function getPaymentWithRetry(id: string) {
      const waits = [0, 1200, 2500]; // 3 intentos, total ~3.7s
      let lastErr: any = null;

      for (const w of waits) {
        if (w) await sleep(w);
        try {
          return await paymentApi.get({ id });
        } catch (e: any) {
          lastErr = e;
          // Si el error es 404, reintentamos
          if (e?.status === 404) continue;
          throw e;
        }
      }

      throw lastErr;
    }

    const paymentData: any = await getPaymentWithRetry(String(paymentId));
    console.log("Payment data:", {
      id: paymentData?.id,
      status: paymentData?.status,
      external_reference: paymentData?.external_reference,
      preference_id: paymentData?.preference_id,
      live_mode: paymentData?.live_mode,
    });

    // Procesar solo aprobados
    if (paymentData?.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    const externalReference = paymentData?.external_reference;
    if (!externalReference) {
      console.error("No external_reference found in payment");
      return NextResponse.json({ ok: true });
    }

    const { prestadorId, packId, transaccionId } = parseExternalReference(
      String(externalReference)
    );

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

    // ✅ Idempotencia por mp_payment_id (si MP reintenta)
    const { data: existingTx, error: existingTxError } = await supabase
      .from("transacciones")
      .select("id")
      .eq("mp_payment_id", String(paymentId))
      .maybeSingle();

    if (existingTxError) {
      console.error("Error verificando transacción existente:", existingTxError);
      return NextResponse.json({ ok: true });
    }

    if (existingTx?.id) {
      console.log("Transaction already processed:", existingTx.id);
      return NextResponse.json({ ok: true });
    }

    // ✅ Si tenemos transaccionId, actualizamos esa transacción pendiente (mejor que crear otra)
    if (transaccionId) {
      // Si ya estaba aprobada, evitamos doble acreditación
      const { data: txCheck, error: txCheckError } = await supabase
        .from("transacciones")
        .select("id, estado_pago, mp_payment_id")
        .eq("id", transaccionId)
        .maybeSingle();

      if (txCheckError) {
        console.error("Error verificando transacción por transaccionId:", txCheckError);
        return NextResponse.json({ ok: true });
      }

      if (txCheck?.estado_pago === "aprobado" || txCheck?.mp_payment_id) {
        console.log("Tx already approved/has mp_payment_id:", transaccionId);
        return NextResponse.json({ ok: true });
      }

      const { error: txUpdateError } = await supabase
        .from("transacciones")
        .update({
          estado_pago: "aprobado",
          metodo_pago: "mercadopago",
          mp_payment_id: String(paymentId),
          mp_preference_id: paymentData?.preference_id ? String(paymentData.preference_id) : null,
          monto_ars: Number(pack.precio_ars),
          creditos: Number(pack.cantidad_creditos),
          prestador_id: prestadorId,
          tipo: "compra_creditos",
        })
        .eq("id", transaccionId);

      if (txUpdateError) {
        console.error("Error updating transaction:", txUpdateError);
        return NextResponse.json({ error: "Error al actualizar transacción" }, { status: 500 });
      }
    } else {
      // Fallback: crear/actualizar por mp_payment_id (requiere índice UNIQUE si querés upsert real)
      const txPayload = {
        prestador_id: prestadorId,
        tipo: "compra_creditos",
        monto_ars: Number(pack.precio_ars),
        creditos: Number(pack.cantidad_creditos),
        estado_pago: "aprobado",
        metodo_pago: "mercadopago",
        mp_payment_id: String(paymentId),
        mp_preference_id: paymentData?.preference_id ? String(paymentData.preference_id) : null,
      };

      const { error: transactionError } = await (supabase
        .from("transacciones") as any)
        .insert(txPayload as any);

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        return NextResponse.json({ error: "Error al crear transacción" }, { status: 500 });
      }
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

    console.log(`Credits added: ${creditsToAdd} to user ${prestadorId}. Payment: ${paymentId}`);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Error al procesar webhook" }, { status: 500 });
  }
}
