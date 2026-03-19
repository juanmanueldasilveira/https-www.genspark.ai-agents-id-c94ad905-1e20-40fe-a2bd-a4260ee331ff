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
  return 'US$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
      // Oportunidades
      setLoadingOpps(true)
      fetch('/api/public/oportunidades')
        .then((r) => r.json())
        .then((j) => setOportunidades(j?.data || []))
        .catch(() => setOportunidades([]))
        .finally(() => setLoadingOpps(false))

      // Rosario
      setLoadingRosario(true)
      fetch('/api/public/rosario')
        .then((r) => r.json())
        .then((j) => setRosario(j?.data || null))
        .catch(() => setRosario(null))
        .finally(() => setLoadingRosario(false))

      // Divisas
      setLoadingFx(true)
      fetch('/api/public/divisas')
        .then((r) => r.json())
        .then((j) => setFx(j?.data || []))
        .catch(() => setFx([]))
        .finally(() => setLoadingFx(false))

      // Noticias
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
    // El detalle real lo vamos a proteger luego; por ahora lo mandamos a login/registro
    const redirect = `/dashboard/prestador`
    if (!authReady || !isLogged) {
      goLogin(redirect)
      return
    }
    router.push('/dashboard/prestador')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-bold text-slate-900">AgroConnect</div>
            <div className="text-sm text-slate-600">
              Servicios, oportunidades y mercados del agro (vista pública)
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLogged ? (
              <>
                <button
                  onClick={() => router.push('/dashboard/cliente')}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Panel Productor
                </button>
                <button
                  onClick={() => router.push('/dashboard/prestador')}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Panel Prestador
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => goLogin('/')}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => goRegister('cliente')}
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  Registrarme
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">
              Conectá productores con prestadores de servicios agrícolas
            </h1>
            <p className="text-slate-600 mt-3">
              Mirá oportunidades cargadas, seguí mercados (Rosario/Chicago) y coordiná por WhatsApp
              una vez tomado el trabajo.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => goRegister('cliente')}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Soy Productor
              </button>
              <button
                onClick={() => goRegister('prestador')}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Soy Prestador
              </button>
              <button
                onClick={() => goLogin('/')}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              >
                Ya tengo cuenta
              </button>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {SERVICIOS.map((s) => (
                <div key={s.value} className="border border-slate-200 bg-slate-50 rounded-xl p-3">
                  <div className="text-xl">{s.icon}</div>
                  <div className="font-semibold text-slate-900">{s.label}</div>
                  <div className="text-sm text-slate-600">Ver oportunidades y coordinar.</div>
                </div>
              ))}
            </div>
          </div>

          {/* Markets + FX */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Rosario (CAC/BCR) – Precios Pizarra</h2>
                  <p className="text-sm text-slate-600">
                    Referencia de mercado físico en $/Tn y conversión a US$ (informativo).{' '}
                    <a className="underline" href="http://www.cac.bcr.com.ar/es/precios-de-pizarra" target="_blank" rel="noreferrer">
                      Fuente
                    </a>
                  </p>
                </div>
              </div>

              {loadingRosario ? (
                <div className="text-slate-600 mt-4">Cargando Rosario…</div>
              ) : !rosario ? (
                <div className="text-slate-600 mt-4">No se pudo cargar Rosario.</div>
              ) : (
                <>
                  <div className="text-xs text-slate-500 mt-3">
                    {rosario.dateText ? `Fecha: ${rosario.dateText}` : ''}{' '}
                    {rosario.timeText ? `· Hora: ${rosario.timeText}` : ''}{' '}
                    {rosario.tcBnaComprador ? `· TC BNA comprador: ${formatArs(rosario.tcBnaComprador)}` : ''}
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-600">
                          <th className="py-2">Producto</th>
                          <th className="py-2">$ / Tn</th>
                          <th className="py-2">US$ / Tn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rosario.items.map((it) => (
                          <tr key={it.commodity} className="border-t">
                            <td className="py-2 font-medium text-slate-900">{it.commodity}</td>
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

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Chicago (CME) – Delayed</h2>
                  <p className="text-sm text-slate-600">
                    Cotizaciones retrasadas al menos 10 minutos.{' '}
                    <a
                      className="underline"
                      href="https://www.cmegroup.com/market-data/browse-data/delayed-quotes.html"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver en CME
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-700">
                MVP: mostramos la sección y el enlace oficial. En una segunda iteración podemos intentar extraer
                “Grains/Oilseeds” si el sitio lo permite (muchas veces es contenido dinámico/licenciado).{' '}
                <span className="text-slate-500">
                  (Delayed ≥ 10 min según CME)
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900">Divisas (AR)</h2>
              <p className="text-sm text-slate-600">
                Panel rápido vía DolarApi.{' '}
                <a className="underline" href="https://dolarapi.com/docs/argentina/operations/get-dolares" target="_blank" rel="noreferrer">
                  Fuente
                </a>
              </p>

              {loadingFx ? (
                <div className="text-slate-600 mt-4">Cargando divisas…</div>
              ) : fx.length === 0 ? (
                <div className="text-slate-600 mt-4">No se pudieron cargar divisas.</div>
              ) : (
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {fx.map((d) => (
                    <div key={d.casa} className="border border-slate-200 bg-slate-50 rounded-xl p-3">
                      <div className="font-semibold text-slate-900">{d.nombre}</div>
                      <div className="text-sm text-slate-700">
                        Compra: <strong>{d.compra ?? '—'}</strong> · Venta: <strong>{d.venta ?? '—'}</strong>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {d.fechaActualizacion ? `Actualizado: ${new Date(d.fechaActualizacion).toLocaleString('es-AR')}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Oportunidades */}
        <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Oportunidades abiertas</h2>
              <p className="text-sm text-slate-600">
                Vista pública: mostramos detalles operativos, pero para tomar/coordinar necesitás cuenta.
              </p>
            </div>
            <button
              onClick={() => goRegister('prestador')}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Quiero tomar trabajos
            </button>
          </div>

          {loadingOpps ? (
            <div className="text-slate-600 mt-4">Cargando oportunidades…</div>
          ) : oportunidadesView.length === 0 ? (
            <div className="text-slate-600 mt-4">No hay oportunidades abiertas por ahora.</div>
          ) : (
            <div className="mt-5 grid lg:grid-cols-2 gap-4">
              {oportunidadesView.map((o) => (
                <div key={o.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {o.servicio?.icon ?? '🧩'} {o.servicio?.label ?? o.tipo_servicio}
                      </div>
                      <div className="text-sm text-slate-600">
                        {o.localidad}, {o.provincia}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                      {o.fecha_necesaria ? `Necesaria: ${new Date(o.fecha_necesaria).toLocaleDateString('es-AR')}` : ''}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-700">{o.desc160}</div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-700">
                      <span className="text-slate-500">Hectáreas: </span>
                      <strong>{o.hectareas ?? '—'}</strong>
                    </div>
                    <div className="text-slate-700">
                      <span className="text-slate-500">Toneladas: </span>
                      <strong>{o.toneladas ?? '—'}</strong>
                    </div>
                    <div className="text-slate-700 col-span-2">
                      <span className="text-slate-500">Presupuesto: </span>
                      <strong>
                        {o.presupuesto_estimado ? '$' + o.presupuesto_estimado.toLocaleString('es-AR') : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => onVerOTomar(o)}
                      className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex-1"
                    >
                      Ver / Tomar (requiere cuenta)
                    </button>
                    <button
                      onClick={() => goRegister('cliente')}
                      className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    >
                      Publicar una
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Noticias */}
        <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Noticias agro (Argentina)</h2>
              <p className="text-sm text-slate-600">
                Titulares vía RSS de TodoAgro.{' '}
                <a className="underline" href="https://www.todoagro.com.ar/noticias/feed/" target="_blank" rel="noreferrer">
                  RSS
                </a>
              </p>
            </div>
          </div>

          {loadingNews ? (
            <div className="text-slate-600 mt-4">Cargando noticias…</div>
          ) : news.length === 0 ? (
            <div className="text-slate-600 mt-4">No se pudieron cargar noticias.</div>
          ) : (
            <div className="mt-4 grid lg:grid-cols-2 gap-3">
              {news.map((n) => (
                <a
                  key={n.link}
                  href={n.link}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-white transition"
                >
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {n.pubDate ? new Date(n.pubDate).toLocaleString('es-AR') : ''} {n.source ? `· ${n.source}` : ''}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 text-xs text-slate-500">
          Nota: Chicago (CME) se informa como “Delayed” (≥ 10 min) según la fuente. [Source](https://www.cmegroup.com/market-data/browse-data/delayed-quotes.html)
        </div>
      </div>
    </div>
  )
}
