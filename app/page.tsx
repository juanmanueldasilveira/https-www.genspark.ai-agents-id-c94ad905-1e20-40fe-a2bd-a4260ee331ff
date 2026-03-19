'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Oportunidad = {
  id: string
  tipo_servicio: string
  descripcion: string
  hectareas: number | null
  toneladas: number | null
  fecha_necesaria: string
  provincia: string
  localidad: string
  presupuesto_estimado: number | null
  created_at: string
}

type RosarioItem = {
  commodity: string
  ars_per_tn: number | null
  usd_per_tn: number | null
}

type RosarioResponse = {
  dateText: string | null
  timeText: string | null
  tcBnaComprador: number | null
  items: RosarioItem[]
  sourceUrl: string
}

type DolarItem = {
  casa: string
  nombre: string
  compra: number | null
  venta: number | null
  fechaActualizacion: string | null
}

type NoticiasItem = {
  title: string
  link: string
  pubDate: string | null
  source: string
}

const SERVICIOS = [
  { value: 'pulverizacion', label: 'Pulverización', icon: '🚜' },
  { value: 'siembra', label: 'Siembra', icon: '🌱' },
  { value: 'cosecha', label: 'Cosecha', icon: '🌾' },
  { value: 'flete', label: 'Flete', icon: '🚛' },
] as const

function truncate(s: string, max = 160) {
  const t = (s || '').trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1) + '…'
}

function formatArs(n: number | null) {
  if (n === null || Number.isNaN(n)) return '—'
  return '$' + n.toLocaleString('es-AR')
}

function formatUsd(n: number | null) {
  if (n === null || Number.isNaN(n)) return '—'
  return (
    'US$ ' +
    n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
}

function formatNum(n: number | null) {
  if (n === null || Number.isNaN(n)) return '—'
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

export default function HomePage() {
  const router = useRouter()

  const [authReady, setAuthReady] = useState(false)
  const [isLogged, setIsLogged] = useState(false)

  const [loadingOpps, setLoadingOpps] = useState(true)
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])

  const [loadingRosario, setLoadingRosario] = useState(true)
  const [rosario, setRosario] = useState<RosarioResponse | null>(null)

  const [loadingFx, setLoadingFx] = useState(true)
  const [fx, setFx] = useState<DolarItem[]>([])

  const [loadingNews, setLoadingNews] = useState(true)
  const [news, setNews] = useState<NoticiasItem[]>([])

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser()
      setIsLogged(!!data?.user)
      setAuthReady(true)
    }
    boot()
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoadingOpps(true)
      fetch('/api/public/oportunidades')
        .then((r) => r.json())
        .then((j) => setOportunidades(j?.data || []))
        .catch(() => setOportunidades([]))
        .finally(() => setLoadingOpps(false))

      setLoadingRosario(true)
      fetch('/api/public/rosario')
        .then((r) => r.json())
        .then((j) => setRosario(j?.data || null))
        .catch(() => setRosario(null))
        .finally(() => setLoadingRosario(false))

      setLoadingFx(true)
      fetch('/api/public/divisas')
        .then((r) => r.json())
        .then((j) => setFx(j?.data || []))
        .catch(() => setFx([]))
        .finally(() => setLoadingFx(false))

      setLoadingNews(true)
      fetch('/api/public/noticias')
        .then((r) => r.json())
        .then((j) => setNews(j?.data || []))
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false))
    }

    load()
  }, [])

  const oportunidadesView = useMemo(() => {
    return oportunidades.map((o) => ({
      ...o,
      servicio: SERVICIOS.find((s) => s.value === (o.tipo_servicio as any)),
      desc160: truncate(o.descripcion, 160),
    }))
  }, [oportunidades])

  const fxTickerText = useMemo(() => {
    if (loadingFx) return 'Cargando divisas…'
    if (!fx?.length) return 'No se pudieron cargar divisas.'
    // mostramos venta principalmente
    return fx
      .map((d) => `${d.nombre}: ${formatNum(d.venta)}`)
      .join('   •   ')
  }, [fx, loadingFx])

  const newsTickerText = useMemo(() => {
    if (loadingNews) return 'Cargando noticias…'
    if (!news?.length) return 'No se pudieron cargar noticias.'
    return news
      .slice(0, 10)
      .map((n) => truncate(n.title, 80))
      .join('   •   ')
  }, [news, loadingNews])

  const goRegister = (tipo: 'cliente' | 'prestador') => {
    router.push(`/auth/register?tipo=${tipo}`)
  }

  const goLogin = (redirectTo: string) => {
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
  }

  const onVerOTomar = (o: Oportunidad) => {
    // MVP: enviamos al flujo autenticado (prestador)
    const redirect = `/dashboard/prestador`
    if (!authReady || !isLogged) {
      goLogin(redirect)
      return
    }
    router.push('/dashboard/prestador')
  }

  const oppCount = oportunidades.length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TICKERS (franja fina superior) */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-center">
            {/* FX ticker */}
            <div className="ticker-wrap">
              <div className="ticker-label">Divisas</div>
              <div className="ticker-viewport">
                <div className="ticker-move">
                  <span className="ticker-item">{fxTickerText}</span>
                  <span className="ticker-sep">   •   </span>
                  <span className="ticker-item">{fxTickerText}</span>
                </div>
              </div>
            </div>

            {/* News ticker */}
            <div className="ticker-wrap">
              <div className="ticker-label">Noticias</div>
              <div className="ticker-viewport">
                <div className="ticker-move ticker-move-slower">
                  <span className="ticker-item">{newsTickerText}</span>
                  <span className="ticker-sep">   •   </span>
                  <span className="ticker-item">{newsTickerText}</span>
                </div>
              </div>
            </div>
          </div>

          <style jsx global>{`
            .ticker-wrap {
              display: flex;
              align-items: center;
              gap: 10px;
              min-height: 22px;
            }
            .ticker-label {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a; /* slate-900 */
              padding: 2px 8px;
              border-radius: 999px;
              background: #f1f5f9; /* slate-100 */
              border: 1px solid #e2e8f0; /* slate-200 */
              white-space: nowrap;
            }
            .ticker-viewport {
              position: relative;
              overflow: hidden;
              width: 100%;
              border-radius: 999px;
              border: 1px solid #e2e8f0;
              background: #ffffff;
              height: 22px;
              display: flex;
              align-items: center;
            }
            .ticker-move {
              display: inline-flex;
              align-items: center;
              white-space: nowrap;
              will-change: transform;
              animation: tickerScroll 22s linear infinite;
              padding-left: 100%;
            }
            .ticker-move-slower {
              animation-duration: 30s;
            }
            .ticker-item {
              font-size: 12px;
              color: #334155; /* slate-700 */
              padding: 0 10px;
            }
            .ticker-sep {
              font-size: 12px;
              color: #94a3b8; /* slate-400 */
            }
            @keyframes tickerScroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-100%);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .ticker-move,
              .ticker-move-slower {
                animation: none;
                padding-left: 0;
              }
            }
          `}</style>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white grid place-items-center font-bold">
              A
            </div>
            <div>
              <div className="text-lg font-extrabold leading-tight">AgroConnect</div>
              <div className="text-xs text-slate-600">
                Portal público · {oppCount} oportunidades abiertas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLogged ? (
              <>
                <button
                  onClick={() => router.push('/dashboard/cliente')}
                  className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Panel Productor
                </button>
                <button
                  onClick={() => router.push('/dashboard/prestador')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                >
                  Ir al Panel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => goLogin('/')}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => goRegister('cliente')}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold"
                >
                  Registrarme
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN 3-COLUMN LAYOUT */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-600">Mercado de granos</div>
                  <div className="text-xl font-extrabold">Rosario</div>
                  <div className="text-xs text-slate-500 mt-1">
                    CAC/BCR · Precios Pizarra ($/Tn)
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 grid place-items-center">
                  📈
                </div>
              </div>

              {loadingRosario ? (
                <div className="text-slate-600 mt-4">Cargando…</div>
              ) : !rosario ? (
                <div className="text-slate-600 mt-4">No se pudo cargar Rosario.</div>
              ) : (
                <>
                  <div className="text-xs text-slate-500 mt-3">
                    {rosario.dateText ? `Fecha: ${rosario.dateText}` : ''}{' '}
                    {rosario.timeText ? `· Hora: ${rosario.timeText}` : ''}{' '}
                    {rosario.tcBnaComprador ? `· TC BNA: ${formatArs(rosario.tcBnaComprador)}` : ''}
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-600">
                          <th className="py-2">Prod.</th>
                          <th className="py-2">$</th>
                          <th className="py-2">US$</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rosario.items.map((it) => (
                          <tr key={it.commodity} className="border-t">
                            <td className="py-2 font-semibold">{it.commodity}</td>
                            <td className="py-2">{formatArs(it.ars_per_tn)}</td>
                            <td className="py-2">{formatUsd(it.usd_per_tn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <a
                    href={rosario.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Ver fuente
                  </a>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-600">Mercado de granos</div>
              <div className="text-xl font-extrabold">Chicago (CME)</div>
              <div className="text-xs text-slate-500 mt-1">
                Delayed (≥ 10 min) + link oficial
              </div>

              <div className="mt-3 text-sm text-slate-700 leading-relaxed">
                Mostramos delayed y dejamos el acceso al mercado en CME para ver al momento.
              </div>

              <a
                href="https://www.cmegroup.com/market-data/browse-data/delayed-quotes.html"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-sm"
              >
                Abrir CME (Delayed Quotes)
              </a>
            </div>
          </aside>

          {/* CENTER (OPPORTUNITIES) */}
          <section className="col-span-12 lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold">Oportunidades abiertas</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Vista pública: sin costo de créditos ni contacto. Para tomar, necesitás cuenta.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => goRegister('cliente')}
                      className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      Publicar solicitud
                    </button>
                    <button
                      onClick={() => goRegister('prestador')}
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                    >
                      Tomar trabajos
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loadingOpps ? (
                  <div className="text-slate-600">Cargando oportunidades…</div>
                ) : oportunidadesView.length === 0 ? (
                  <div className="text-slate-600">No hay oportunidades abiertas por ahora.</div>
                ) : (
                  <div className="space-y-4">
                    {oportunidadesView.map((o) => (
                      <div
                        key={o.id}
                        className="rounded-2xl border border-slate-200 bg-white hover:shadow-md transition overflow-hidden"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-lg font-extrabold">
                                {o.servicio?.icon ?? '🧩'}{' '}
                                {o.servicio?.label ?? o.tipo_servicio}
                              </div>
                              <div className="text-sm text-slate-600">
                                {o.localidad}, {o.provincia}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-slate-500">Fecha necesaria</div>
                              <div className="text-sm font-semibold">
                                {o.fecha_necesaria
                                  ? new Date(o.fecha_necesaria).toLocaleDateString('es-AR')
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                            {o.desc160}
                          </p>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                              <div className="text-xs text-slate-500">Hectáreas</div>
                              <div className="font-bold">{o.hectareas ?? '—'}</div>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                              <div className="text-xs text-slate-500">Toneladas</div>
                              <div className="font-bold">{o.toneladas ?? '—'}</div>
                            </div>
                            <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                              <div className="text-xs text-slate-500">Presupuesto</div>
                              <div className="font-bold">
                                {o.presupuesto_estimado
                                  ? '$' + o.presupuesto_estimado.toLocaleString('es-AR')
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => onVerOTomar(o)}
                              className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold"
                            >
                              Ver / Tomar (requiere cuenta)
                            </button>
                            <button
                              onClick={() => goRegister('cliente')}
                              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
                            >
                              Publicar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT SIDEBAR (NEWS LIST) */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-600">Actualidad</div>
                  <div className="text-xl font-extrabold">Noticias</div>
                  <div className="text-xs text-slate-500 mt-1">Resumen y acceso a la nota</div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center">
                  📰
                </div>
              </div>

              {loadingNews ? (
                <div className="text-slate-600 mt-4">Cargando…</div>
              ) : news.length === 0 ? (
                <div className="text-slate-600 mt-4">No se pudieron cargar noticias.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {news.slice(0, 10).map((n) => (
                    <a
                      key={n.link}
                      href={n.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition p-3"
                      title={n.title}
                    >
                      <div className="font-semibold text-sm leading-snug">
                        {truncate(n.title, 90)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {n.pubDate ? new Date(n.pubDate).toLocaleString('es-AR') : ''}{' '}
                        {n.source ? `· ${n.source}` : ''}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-600">Accesos rápidos</div>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => goRegister('cliente')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                >
                  Publicar una solicitud
                </button>
                <button
                  onClick={() => goRegister('prestador')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold"
                >
                  Registrarme como prestador
                </button>
                <button
                  onClick={() => goLogin('/')}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Ingresar
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
