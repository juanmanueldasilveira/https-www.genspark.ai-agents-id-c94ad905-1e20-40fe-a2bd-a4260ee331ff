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

    // 1) Parse body (puede NO ser JSON)
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // 2) Parse query params (MP a veces manda ?type=payment&data.id=...)
    const sp = request.nextUrl.searchParams;
    const type = body?.type ?? sp.get("type");
    const action = body?.action ?? sp.get("action");
    const liveMode = body?.live_mode ?? sp.get("live_mode");

    const paymentId =
      body?.data?.id ??
      sp.get("data.id") ??
      sp.get("data_id") ??
      sp.get("id");

    console.log("MercadoPago webhook received:", {
      action,
      type,
      live_mode: liveMode,
      dataId: paymentId,
      hasBodyKeys: Object.keys(body || {}).length,
      url: request.nextUrl.toString(),
    });

    if (type !== "payment") return NextResponse.json({ ok: true });
    if (!paymentId) return NextResponse.json({ ok: true });

    // 3) Consultar pago con retry (en TEST puede tardar a veces)
    const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const paymentApi = new Payment(mpClient);

    async function getPaymentWithRetry(id: string) {
      const waits = [0, 1500, 3500, 6500]; // ~11.5s total
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

    if (paymentData?.status !== "approved") return NextResponse.json({ ok: true });

    const externalReference = paymentData?.external_reference;
    if (!externalReference) return NextResponse.json({ ok: true });

    const { prestadorId, packId, transaccionId } = parseExternalReference(String(externalReference));
    if (!prestadorId || !packId) return NextResponse.json({ ok: true });

    // pack
    const { data: packData } = await supabase
      .from("packs_creditos")
      .select("*")
      .eq("id", packId)
      .maybeSingle();

    const pack = packData as PackCreditos | null;
    if (!pack || pack.activo === false) return NextResponse.json({ ok: true });

    // Idempotencia por paymentId
    const { data: existingTx } = await supabase
      .from("transacciones")
      .select("id")
      .eq("mp_payment_id", String(paymentId))
      .maybeSingle();

    if (existingTx?.id) {
      console.log("Already processed paymentId:", String(paymentId));
      return NextResponse.json({ ok: true });
    }

    // Actualizar la tx pendiente si tenemos transaccionId
    if (transaccionId) {
      const { data: txCheck } = await supabase
        .from("transacciones")
        .select("id, estado_pago, mp_payment_id")
        .eq("id", transaccionId)
        .maybeSingle();

      if (txCheck?.estado_pago === "aprobado" || txCheck?.mp_payment_id) {
        console.log("Tx already approved:", transaccionId);
        return NextResponse.json({ ok: true });
      }

      const { error: txUpdateError } = await supabase
        .from("transacciones")
        .update({
          estado_pago: "aprobado",
          metodo_pago: "mercadopago",
          mp_payment_id: String(paymentId),
          mp_preference_id: paymentData?.preference_id ? String(paymentData.preference_id) : null,
        })
        .eq("id", transaccionId);

      if (txUpdateError) {
        console.error("Error updating tx:", txUpdateError);
        return NextResponse.json({ error: "Error al actualizar transacción" }, { status: 500 });
      }
    }

    // Acreditar créditos
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("creditos_disponibles")
      .eq("id", prestadorId)
      .maybeSingle();

    if (usuarioError || !usuario) {
      console.error("User fetch error:", usuarioError);
      return NextResponse.json({ ok: true });
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
