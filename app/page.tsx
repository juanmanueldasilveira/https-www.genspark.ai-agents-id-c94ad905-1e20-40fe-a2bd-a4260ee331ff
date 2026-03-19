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
  { value: 'pulverizacion', label: 'Pulverización', icon: '🚜', tint: 'from-emerald-500/20 to-emerald-500/0' },
  { value: 'siembra', label: 'Siembra', icon: '🌱', tint: 'from-lime-500/20 to-lime-500/0' },
  { value: 'cosecha', label: 'Cosecha', icon: '🌾', tint: 'from-amber-500/20 to-amber-500/0' },
  { value: 'flete', label: 'Flete', icon: '🚛', tint: 'from-sky-500/20 to-sky-500/0' },
] as const

// Imagen CC (Wikimedia Commons) [Source](https://commons.wikimedia.org/wiki/File:Sunset-over-the-wheat-field-featured.jpg)
const HERO_IMAGE =
  'https://sspark.genspark.ai/cfimages?u1=tyn18CSWm20azmHCeA3cMJxEqWTiA6X57SHN6NjTomKijIOvxzZP4zVbje%2FUQeoDZ%2FNjWVO0N1c4z8yacwX3PP%2BNGIIrA71DJZqHTe6Qp1%2B7PBWCwAjP3CaEEdaI3FfWt2ERVMj%2BITbQm4KV&u2=%2BKTiQln0PG%2B%2BLnUq&width=2560'

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

function pill(label: string) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
      {label}
    </span>
  )
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

  const goRegister = (tipo: 'cliente' | 'prestador') => {
    router.push(`/auth/register?tipo=${tipo}`)
  }

  const goLogin = (redirectTo: string) => {
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
  }

  const onVerOTomar = (o: Oportunidad) => {
    // MVP: enviamos al flujo autenticado (prestador) y el resto lo haces desde el dashboard
    const redirect = `/dashboard/prestador`
    if (!authReady || !isLogged) {
      goLogin(redirect)
      return
    }
    router.push('/dashboard/prestador')
  }

  const oppCount = oportunidades.length

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Campo al atardecer"
            className="h-full w-full object-cover opacity-35"
          />
          {/* overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_55%)]" />
        </div>

        {/* Top nav */}
        <div className="relative z-10">
          <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-white/10 grid place-items-center">
                <span className="text-xl">🌾</span>
              </div>
              <div>
                <div className="font-bold tracking-tight text-lg">AgroConnect</div>
                <div className="text-xs text-white/70">Portal público</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLogged ? (
                <>
                  <button
                    onClick={() => router.push('/dashboard/cliente')}
                    className="hidden sm:inline-flex rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 transition"
                  >
                    Panel Productor
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/prestador')}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    Ir al Panel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => goLogin('/')}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 transition"
                  >
                    Ingresar
                  </button>
                  <button
                    onClick={() => goRegister('cliente')}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    Registrarme
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Hero content */}
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-6">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {pill(`${oppCount} oportunidades abiertas`)}
                  {pill('Rosario + Chicago (delayed)')}
                  {pill('Divisas + Noticias')}
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
                  Conectá productores y prestadores <span className="text-emerald-300">en un flujo simple</span>
                </h1>
                <p className="mt-4 text-white/80 text-lg leading-relaxed">
                  Explorá oportunidades reales, seguí mercados y coordiná por WhatsApp una vez asignado el trabajo.
                  Para ver detalles y tomar oportunidades, necesitás cuenta.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => goRegister('cliente')}
                    className="rounded-2xl bg-white px-5 py-3 text-slate-950 font-semibold hover:bg-white/90 transition"
                  >
                    Soy Productor — Publicar solicitud
                  </button>
                  <button
                    onClick={() => goRegister('prestador')}
                    className="rounded-2xl bg-emerald-500 px-5 py-3 text-slate-950 font-semibold hover:bg-emerald-400 transition"
                  >
                    Soy Prestador — Tomar trabajos
                  </button>
                  <button
                    onClick={() => goLogin('/')}
                    className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10 transition"
                  >
                    Ya tengo cuenta
                  </button>
                </div>

                <div className="mt-8 grid sm:grid-cols-2 gap-3">
                  {SERVICIOS.map((s) => (
                    <div
                      key={s.value}
                      className={`rounded-2xl border border-white/10 bg-gradient-to-b ${s.tint} backdrop-blur px-4 py-4`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="text-2xl">{s.icon}</div>
                        <span className="text-xs text-white/60">Catálogo</span>
                      </div>
                      <div className="mt-2 font-bold">{s.label}</div>
                      <div className="text-sm text-white/75">
                        Oportunidades filtradas por servicio y zona.
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column: market cards */}
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-white/70">Rosario (CAC/BCR)</div>
                      <div className="text-xl font-extrabold tracking-tight">Precios Pizarra</div>
                      <div className="text-xs text-white/60 mt-1">
                        $/Tn y conversión a US$ (informativo).{' '}
                        <a
                          className="underline hover:text-white"
                          href="http://www.cac.bcr.com.ar/es/precios-de-pizarra"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Fuente
                        </a>
                      </div>
                    </div>
                    <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-white/10 grid place-items-center">
                      📈
                    </div>
                  </div>

                  {loadingRosario ? (
                    <div className="mt-4 text-white/70">Cargando…</div>
                  ) : !rosario ? (
                    <div className="mt-4 text-white/70">No se pudo cargar Rosario.</div>
                  ) : (
                    <>
                      <div className="mt-3 text-xs text-white/60">
                        {rosario.dateText ? `Fecha: ${rosario.dateText}` : ''}{' '}
                        {rosario.timeText ? `· Hora: ${rosario.timeText}` : ''}{' '}
                        {rosario.tcBnaComprador ? `· TC BNA: ${formatArs(rosario.tcBnaComprador)}` : ''}
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-white/70">
                              <th className="py-2">Producto</th>
                              <th className="py-2">$ / Tn</th>
                              <th className="py-2">US$ / Tn</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rosario.items.map((it) => (
                              <tr key={it.commodity} className="border-t border-white/10">
                                <td className="py-2 font-semibold">{it.commodity}</td>
                                <td className="py-2">{formatArs(it.ars_per_tn)}</td>
                                <td className="py-2">{formatUsd(it.usd_per_tn)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5">
                    <div className="text-sm text-white/70">Chicago (CME)</div>
                    <div className="text-lg font-extrabold tracking-tight">Delayed</div>
                    <div className="text-xs text-white/60 mt-1">
                      Delayed ≥ 10 min.{' '}
                      <a
                        className="underline hover:text-white"
                        href="https://www.cmegroup.com/market-data/browse-data/delayed-quotes.html"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver en CME
                      </a>
                    </div>
                    <div className="mt-3 text-sm text-white/75 leading-relaxed">
                      Mostramos el bloque con link oficial. Si querés, en la próxima iteración intentamos
                      extraer valores “Grains/Oilseeds” y cachearlos (según disponibilidad/licencia).
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5">
                    <div className="text-sm text-white/70">Divisas (AR)</div>
                    <div className="text-lg font-extrabold tracking-tight">Panel rápido</div>
                    <div className="text-xs text-white/60 mt-1">
                      Fuente: DolarApi.
                    </div>

                    {loadingFx ? (
                      <div className="mt-4 text-white/70">Cargando…</div>
                    ) : fx.length === 0 ? (
                      <div className="mt-4 text-white/70">No se pudieron cargar divisas.</div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {fx.slice(0, 5).map((d) => (
                          <div
                            key={d.casa}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <div className="text-sm font-semibold">{d.nombre}</div>
                            <div className="text-sm text-white/80">
                              <span className="text-white/50">V:</span>{' '}
                              <span className="font-semibold">{d.venta ?? '—'}</span>
                            </div>
                          </div>
                        ))}
                        <div className="text-xs text-white/55 pt-1">
                          (Mostrando 5. El resto queda dentro del endpoint /api/public/divisas)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* end right column */}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-12 space-y-10">
          {/* Oportunidades */}
          <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="p-6 sm:p-7 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Oportunidades abiertas</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Vista pública: no mostramos costo de créditos ni contacto. Para tomar, necesitás cuenta.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => goRegister('prestador')}
                    className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:bg-slate-800 transition"
                  >
                    Tomar trabajos
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              {loadingOpps ? (
                <div className="text-slate-600">Cargando oportunidades…</div>
              ) : oportunidadesView.length === 0 ? (
                <div className="text-slate-600">No hay oportunidades abiertas por ahora.</div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-4">
                  {oportunidadesView.map((o) => (
                    <div
                      key={o.id}
                      className="group rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_12px_30px_-22px_rgba(0,0,0,0.35)] transition overflow-hidden"
                    >
                      <div className={`h-1.5 bg-gradient-to-r ${o.servicio?.tint ?? 'from-slate-200 to-transparent'}`} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-extrabold tracking-tight">
                              {o.servicio?.icon ?? '🧩'} {o.servicio?.label ?? o.tipo_servicio}
                            </div>
                            <div className="text-sm text-slate-600">
                              {o.localidad}, {o.provincia}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Necesaria</div>
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
                            className="flex-1 rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition"
                          >
                            Ver / Tomar (requiere cuenta)
                          </button>
                          <button
                            onClick={() => goRegister('cliente')}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
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
          </section>

          {/* Noticias */}
          <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="p-6 sm:p-7 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Noticias agro (Argentina)</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Titulares vía RSS de TodoAgro.{' '}
                    <a className="underline" href="https://www.todoagro.com.ar/noticias/feed/" target="_blank" rel="noreferrer">
                      RSS
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              {loadingNews ? (
                <div className="text-slate-600">Cargando noticias…</div>
              ) : news.length === 0 ? (
                <div className="text-slate-600">No se pudieron cargar noticias.</div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-3">
                  {news.map((n) => (
                    <a
                      key={n.link}
                      href={n.link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition p-4"
                    >
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {n.pubDate ? new Date(n.pubDate).toLocaleString('es-AR') : ''}{' '}
                        {n.source ? `· ${n.source}` : ''}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="text-xs text-slate-500">
            Chicago (CME) se muestra como “Delayed” (≥ 10 min) según la fuente. [Source](https://www.cmegroup.com/market-data/browse-data/delayed-quotes.html)
          </div>
        </div>
      </div>
    </div>
  )
}
