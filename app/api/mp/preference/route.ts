import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import MercadoPagoConfig, { Preference } from "mercadopago";

// Importante: MercadoPago SDK requiere runtime Node.js (no Edge)
export const runtime = "nodejs";
// Evita caches inesperados en endpoints de pago
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

type Body = {
  packId: string;
  prestadorId: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const MERCADOPAGO_ACCESS_TOKEN = requireEnv("MERCADOPAGO_ACCESS_TOKEN");
    const APP_BASE_URL = requireEnv("APP_BASE_URL");

    // 1) Parse body
    const body = (await req.json()) as Partial<Body>;
    const packId = body.packId?.trim();
    const prestadorId = body.prestadorId?.trim();

    if (!packId || !prestadorId) {
      return NextResponse.json(
        { error: "Faltan parámetros: packId y prestadorId son requeridos." },
        { status: 400 }
      );
    }

    // 2) Supabase Admin (sin tipado fuerte para evitar `never`)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 3) Buscar pack
    const { data: packData, error: packError } = await supabase
      .from("packs_creditos")
      .select("*")
      .eq("id", packId)
      .single();

    if (packError) {
      return NextResponse.json(
        { error: "Error consultando el pack de créditos.", details: packError.message },
        { status: 500 }
      );
    }

    // ✅ casteo + guard
    const pack = packData as PackCreditos | null;

    if (!pack) {
      return NextResponse.json({ error: "Pack no encontrado." }, { status: 404 });
    }
    if (pack.activo === false) {
      return NextResponse.json({ error: "El pack no está activo." }, { status: 400 });
    }

    // 4) Crear transacción interna (estado pendiente)
    // ✅ IMPORTANTE: el schema solo permite pendiente/aprobado/rechazado
    const { data: txInsert, error: txError } = await supabase
      .from("transacciones")
      .insert({
        solicitud_id: null,
        cliente_id: null,
        prestador_id: prestadorId,
        tipo: "compra_creditos",
        monto_ars: Number(pack.precio_ars),
        creditos: Number(pack.cantidad_creditos),
        porcentaje_canon: null,
        estado_pago: "pendiente",
        metodo_pago: "mercadopago",
        mp_payment_id: null,
        mp_preference_id: null,
      })
      .select("id")
      .single();

    if (txError) {
      return NextResponse.json(
        { error: "Error creando la transacción.", details: txError.message },
        { status: 500 }
      );
    }

    const transaccionId = txInsert?.id as string;

    // 5) Crear preferencia MercadoPago Checkout Pro
    const mpClient = new MercadoPagoConfig({
      accessToken: MERCADOPAGO_ACCESS_TOKEN,
    });
    const preference = new Preference(mpClient);

    const backUrls = {
      success: `${APP_BASE_URL}/mp/return?status=success&tx=${transaccionId}`,
      failure: `${APP_BASE_URL}/mp/return?status=failure&tx=${transaccionId}`,
      pending: `${APP_BASE_URL}/mp/return?status=pending&tx=${transaccionId}`,
    };

    // ✅ Alinear con tu ruta real: /api/mp/webhook
    const notificationUrl = `${APP_BASE_URL}/api/mp/webhook`;

    const prefResp = await preference.create({
      body: {
        items: [
          {
            id: pack.id,
            title: `${pack.nombre} - ${pack.cantidad_creditos} créditos`,
            description: "Pack de créditos para AgroServicios Argentina",
            quantity: 1,
            unit_price: Number(pack.precio_ars),
            currency_id: "ARS",
          },
        ],
        back_urls: backUrls,
        auto_return: "approved",
        notification_url: notificationUrl,
        external_reference: `credits:${transaccionId}:${prestadorId}:${pack.id}`,
      },
    });

    const mpPreferenceId = (prefResp as any)?.id ?? null;
    const initPoint = (prefResp as any)?.init_point ?? null;
    const sandboxInitPoint = (prefResp as any)?.sandbox_init_point ?? null;

    // 6) Guardar mp_preference_id en la transacción (best effort)
    if (mpPreferenceId) {
      await supabase
        .from("transacciones")
        .update({ mp_preference_id: mpPreferenceId })
        .eq("id", transaccionId);
    }

    if (!initPoint && !sandboxInitPoint) {
      return NextResponse.json(
        {
          error: "MercadoPago no devolvió init_point/sandbox_init_point.",
          details: { mpPreferenceId },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        transaccionId,
        mpPreferenceId,
        init_point: initPoint ?? sandboxInitPoint,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Error inesperado creando preferencia.",
        details: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
