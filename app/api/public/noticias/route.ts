import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function decodeCdata(s: string) {
  return s.replace('<![CDATA[', '').replace(']]>', '').trim()
}

function pickTag(block: string, tag: string) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = block.match(re)
  return m ? decodeCdata(m[1]) : null
}

export async function GET() {
  const feedUrl = 'https://www.todoagro.com.ar/noticias/feed/'

  try {
    const resp = await fetch(feedUrl, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'AgroConnectBot/1.0' },
    })
    if (!resp.ok) {
      return NextResponse.json({ error: 'No se pudo obtener RSS' }, { status: 502 })
    }

    const xml = await resp.text()

    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || []
    const data = items.slice(0, 10).map((it) => ({
      title: pickTag(it, 'title') || 'Sin título',
      link: pickTag(it, 'link') || '#',
      pubDate: pickTag(it, 'pubDate'),
      source: 'TodoAgro',
    }))

    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'public, max-age=300' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}
