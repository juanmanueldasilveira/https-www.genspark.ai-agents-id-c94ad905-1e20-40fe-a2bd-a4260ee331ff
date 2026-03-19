import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const casasMap: Record<string, string> = {
  oficial: 'Oficial',
  blue: 'Blue',
  bolsa: 'MEP',
  contadoconliqui: 'CCL',
  mayorista: 'Mayorista',
  tarjeta: 'Tarjeta',
  cripto: 'Cripto',
}

export async function GET() {
  try {
    const resp = await fetch('https://dolarapi.com/v1/dolares', {
      next: { revalidate: 60 },
      headers: { 'User-Agent': 'AgroConnectBot/1.0' },
    })
    if (!resp.ok) {
      return NextResponse.json({ error: 'No se pudo obtener DolarApi' }, { status: 502 })
    }

    const raw = await resp.json()

    const wanted = ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'mayorista', 'tarjeta', 'cripto']

    const data = (Array.isArray(raw) ? raw : [])
      .filter((d: any) => wanted.includes(d?.casa))
      .map((d: any) => ({
        casa: d.casa,
        nombre: casasMap[d.casa] ?? d.casa,
        compra: d.compra ?? null,
        venta: d.venta ?? null,
        fechaActualizacion: d.fechaActualizacion ?? null,
      }))

    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'public, max-age=60' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}
