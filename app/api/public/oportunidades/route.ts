import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Falta NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }
    if (!serviceKey) {
      return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY (server-only)' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { data, error } = await supabase
      .from('solicitudes')
      .select('id,tipo_servicio,descripcion,hectareas,toneladas,fecha_necesaria,provincia,localidad,presupuesto_estimado,created_at,estado')
      .eq('estado', 'abierta')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error

    // Importante: no devolvemos costo_creditos, cliente_id, etc.
    const cleaned = (data || []).map((s: any) => ({
      id: s.id,
      tipo_servicio: s.tipo_servicio,
      descripcion: s.descripcion || '',
      hectareas: s.hectareas ?? null,
      toneladas: s.toneladas ?? null,
      fecha_necesaria: s.fecha_necesaria,
      provincia: s.provincia,
      localidad: s.localidad,
      presupuesto_estimado: s.presupuesto_estimado ?? null,
      created_at: s.created_at,
    }))

    return NextResponse.json(
      { data: cleaned },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}
