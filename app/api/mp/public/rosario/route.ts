import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function parseNumberAR(s: string | null) {
  if (!s) return null
  // "474.500,00" -> 474500.00
  const cleaned = s.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function findCommodity(html: string, name: string) {
  // Buscamos: "Trigo" luego "$ 255.000,00" y luego "US$ 183,85"
  const re = new RegExp(
    `${name}[\\s\\S]{0,600}?\\$\\s*([0-9\\.]+,[0-9]{2})[\\s\\S]{0,600}?US\\$\\s*([0-9\\.]+,[0-9]{2})`,
    'i'
  )
  const m = html.match(re)
  return {
    ars: parseNumberAR(m?.[1] ?? null),
    usd: parseNumberAR(m?.[2] ?? null),
  }
}

function findText(html: string, re: RegExp) {
  const m = html.match(re)
  return m?.[1]?.trim() ?? null
}

export async function GET() {
  const sourceUrl = 'http://www.cac.bcr.com.ar/es/precios-de-pizarra'

  try {
    const resp = await fetch(sourceUrl, {
      // un caché corto para no pegarle todo el tiempo a la fuente
      next: { revalidate: 120 },
      headers: { 'User-Agent': 'AgroConnectBot/1.0' },
    })
    if (!resp.ok) {
      return NextResponse.json({ error: 'No se pudo obtener la fuente Rosario' }, { status: 502 })
    }

    const html = await resp.text()

    const trigo = findCommodity(html, 'Trigo')
    const maiz = findCommodity(html, 'Ma[ií]z')
    const girasol = findCommodity(html, 'Girasol')
    const soja = findCommodity(html, 'Soja')
    const sorgo = findCommodity(html, 'Sorgo')

    // Intentos de extraer fecha/hora/TC BNA (pueden variar)
    const dateText =
      findText(html, /Precios Pizarra del d[ií]a\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i) ??
      null

    const timeText =
      findText(html, /Hora:\s*([0-9]{1,2}:[0-9]{2})/i) ??
      null

    const tcBna =
      parseNumberAR(findText(html, /TC\s*BNA[^0-9]*Comprador[^0-9]*([0-9\.]+,[0-9]{2})/i))

    const items = [
      { commodity: 'Trigo', ars_per_tn: trigo.ars, usd_per_tn: trigo.usd },
      { commodity: 'Maíz', ars_per_tn: maiz.ars, usd_per_tn: maiz.usd },
      { commodity: 'Girasol', ars_per_tn: girasol.ars, usd_per_tn: girasol.usd },
      { commodity: 'Soja', ars_per_tn: soja.ars, usd_per_tn: soja.usd },
      { commodity: 'Sorgo', ars_per_tn: sorgo.ars, usd_per_tn: sorgo.usd },
    ]

    return NextResponse.json(
      {
        data: {
          dateText,
          timeText,
          tcBnaComprador: tcBna,
          items,
          sourceUrl,
        },
      },
      { headers: { 'Cache-Control': 'public, max-age=120' } }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}
