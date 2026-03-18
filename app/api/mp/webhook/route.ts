import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

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
  return process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || "";
}

function parseExternalReference(externalReference: string): {
  prestadorId: string | null;
  packId: string | null;
  transaccionId: string | null;
} {
  // credits:transaccionId:prestadorId:packId
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

  // prestadorId-packId (legacy)
  if (externalReference.includes("-")) {
    const [prestadorId, packId] = externalReference.split("-");
    return { transaccionId: null, prestadorId: prestadorId || null, packId: packId || null };
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
      return NextResponse.json({ ok: true });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const body = await request.json();
    console.log("MercadoPago webhook received:", {
      action: body?.action,
      type: body?.type,
      live_mode: body?.live_mode,
      dataId: body?.data?.id,
    });

    if (body?.type !== "payment") return NextResponse.json({ ok: true });

    const paymentId = body?.data?.id;
    if (!paymentId) return NextResponse.json({ error: "payment_id no encontrado" }, { status: 400 });

    const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const paymentApi = new Payment(mpClient);

    async function getPaymentWithRetry(id: string) {
      // Esperas un poco más para evitar el 404 “Payment not found” en TEST
      const waits = [0, 1500, 3500, 6500]; // total ~11.5s
      let lastErr: any = null;

      for (const w of waits) {
        if (w) await sleep(w);
        try {
          return await paymentApi.get({ id });
        } catch (e: any) {
          lastErr = e;
          if (e?.status === 404) continue;
          throw e;
        }
      }
      throw lastErr;
    }

    let paymentData: any;
    try {
      paymentData = await getPaymentWithRetry(String(paymentId));
    } catch (e: any) {
      // Si sigue 404, no rompemos (MP reintenta y/o manda otro evento)
      if (e?.status === 404) {
        console.warn("Payment still not found after retries:", String(paymentId));
        return NextResponse.json({ ok: true });
      }
      throw e;
    }

    console.log("Payment fetched:", {
      id: paymentData?.id,
      status: paymentData?.status,
      external_reference: paymentData?.external_reference,
      preference_id: paymentData?.preference_id,
      live_mode: paymentData?.live_mode,
    });

    if (paymentData?.status !== "approved") {
      console.log("Payment not approved yet, ignoring:", {
        id: paymentData?.id,
        status: paymentData?.status,
      });
      return NextResponse.json({ ok: true });
    }

    const externalReference = paymentData?.external_reference;
    if (!externalReference) {
      console.error("No external_reference found in payment");
      return NextResponse.json({ ok: true });
    }

    const { prestadorId, packId, transaccionId } = parseExternalReference(String(externalReference));
    if (!prestadorId || !packId) {
      console.error("external_reference inválida:", externalReference);
      return NextResponse.json({ ok: true });
    }

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

    // Idempotencia por paymentId
    const { data: existingTx } = await supabase
      .from("transacciones")
      .select("id")
      .eq("mp_payment_id", String(paymentId))
      .maybeSingle();

    if (existingTx?.id) {
      console.log("Transaction already processed for mp_payment_id:", String(paymentId));
      return NextResponse.json({ ok: true });
    }

    // Preferimos actualizar la tx pendiente creada en /api/mp/preference
    if (transaccionId) {
      const { data: txCheck, error: txCheckError } = await supabase
        .from("transacciones")
        .select("id, estado_pago, mp_payment_id")
        .eq("id", transaccionId)
        .maybeSingle();

      if (txCheckError) {
        console.error("Error verificando tx:", txCheckError);
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
      // Fallback: si no hay transaccionId, insertamos una nueva
      const { error: insertTxError } = await (supabase.from("transacciones") as any).insert({
        prestador_id: prestadorId,
        tipo: "compra_creditos",
        monto_ars: Number(pack.precio_ars),
        creditos: Number(pack.cantidad_creditos),
        estado_pago: "aprobado",
        metodo_pago: "mercadopago",
        mp_payment_id: String(paymentId),
        mp_preference_id: paymentData?.preference_id ? String(paymentData.preference_id) : null,
      });

      if (insertTxError) {
        console.error("Error creating transaction:", insertTxError);
        return NextResponse.json({ error: "Error al crear transacción" }, { status: 500 });
      }
    }

    // Acreditar créditos
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

    console.log("Credits added OK:", { prestadorId, creditsToAdd, paymentId: String(paymentId) });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Error al procesar webhook" }, { status: 500 });
  }
}
