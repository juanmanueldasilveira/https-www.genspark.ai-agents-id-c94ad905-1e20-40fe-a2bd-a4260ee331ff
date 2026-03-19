'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { calculateDistance } from '@/lib/geo/argentina'
import { LogOut, Search, Lock, MapPin, Coins } from 'lucide-react'

type Usuario = {
  id: string
  nombre: string
  email: string
  provincia: string
  localidad: string
  latitud: number
  longitud: number
  servicios_ofrecidos: string[]
  creditos_disponibles: number
}

type Solicitud = {
  id: string
  tipo_servicio: string
  descripcion: string
  hectareas: number | null
  toneladas: number | null
  fecha_necesaria: string
  provincia: string
  localidad: string
  latitud: number
  longitud: number
  estado: string
  presupuesto_estimado: number | null
  costo_creditos: number
  cliente_id: string
  cliente?: {
    nombre: string
    telefono: string | null
    email: string
  }
  distancia?: number
}

type Pack = {
  id: string
  nombre: string
  cantidad_creditos: number
  precio_ars: number
  descuento_porcentaje: number
  popular: boolean
}

const SERVICIOS = [
  { value: 'pulverizacion', label: 'Púlverización', icon: '🚜' },
  { value: 'siembra', label: 'Siembra', icon: '🌱' },
  { value: 'cosecha', label: 'Cosecha', icon: '🌾' },
  { value: 'flete', label: 'Flete', icon: '🚛' },
] as const

function normalizePhoneToWa(phoneRaw: string) {
  let digits = (phoneRaw || '').replace(/\D/g, '')

  // Heurística Argentina si viene sin código país:
  // si guardaron 10/11 dígitos locales, lo pasamos a 549 + local
  if (digits.length === 10 || digits.length === 11) {
    if (digits.startsWith('0')) digits = digits.slice(1)
    digits = digits.replace(/^(\d{2,4})15/, '$1') // quita "15" viejo
    digits = `549${digits}`
  }

  return digits
}

function buildWhatsAppUrl(phoneRaw: string, text: string) {
  const wa = normalizePhoneToWa(phoneRaw)
  const encoded = encodeURIComponent(text)
  return `https://wa.me/${wa}?text=${encoded}`
}

export default function PrestadorDashboard() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'buscar' | 'trabajos' | 'creditos'>('buscar')
  const [filters, setFilters] = useState({
    tipo_servicio: '',
    distancia_max: 0,
  })
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

      if (usuarioError) throw usuarioError
      if ((usuarioData as any).tipo !== 'prestador') {
        router.push('/dashboard/cliente')
        return
      }

      setUsuario(usuarioData as any)

      // Load solicitudes abiertas
      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from('solicitudes')
        .select(
          `
          *,
          cliente:usuarios!solicitudes_cliente_id_fkey(nombre, telefono, email)
        `
        )
        .eq('estado', 'abierta')
        .order('created_at', { ascending: false })

      if (solicitudesError) throw solicitudesError

      // Calculate distances and filter by servicios_ofrecidos
      const solicitudesConDistancia = (solicitudesData || [])
        .filter((s: any) => (usuarioData as any).servicios_ofrecidos?.includes(s.tipo_servicio))
        .map((s: any) => ({
          ...s,
          cliente: Array.isArray(s.cliente) ? s.cliente[0] : s.cliente,
          distancia: calculateDistance(
            Number((usuarioData as any).latitud),
            Number((usuarioData as any).longitud),
            Number(s.latitud),
            Number(s.longitud)
          ),
        }))
        .sort((a: any, b: any) => (a.distancia || 0) - (b.distancia || 0))

      setSolicitudes(solicitudesConDistancia)

      // Load mis solicitudes (trabajos tomados)
      const { data: misData, error: misError } = await supabase
        .from('solicitudes')
        .select(
          `
          *,
          cliente:usuarios!solicitudes_cliente_id_fkey(nombre, telefono, email)
        `
        )
        .eq('prestador_id', user.id)
        .neq('estado', 'cancelada')
        .order('created_at', { ascending: false })

      if (misError) throw misError
      setMisSolicitudes((misData as any) || [])

      // Load packs de creditos
      const { data: packsData, error: packsError } = await supabase
        .from('packs_creditos')
        .select('*')
        .eq('activo', true)
        .order('cantidad_creditos', { ascending: true })

      if (packsError) throw packsError
      setPacks((packsData as any) || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredSolicitudes = solicitudes.filter((s) => {
    if (filters.tipo_servicio && s.tipo_servicio !== filters.tipo_servicio) return false
    if (filters.distancia_max > 0 && (s.distancia || 0) > filters.distancia_max) return false
    return true
  })

  const handleTomarTrabajo = async (solicitud: Solicitud) => {
    if (!usuario) return

    if (usuario.creditos_disponibles < solicitud.costo_creditos) {
      alert('No tenés suficientes créditos. Comprá un pack para continuar.')
      setTab('creditos')
      return
    }

    if (!confirm(`¿Tomar este trabajo? Se descontarán ${solicitud.costo_creditos} créditos.`)) {
      return
    }

    setLoading(true)
    try {
      // 1) Tomar solicitud SOLO si sigue abierta y sin prestador
      const { data: taken, error: updateError } = await supabase
        .from('solicitudes')
        .update({
          prestador_id: usuario.id,
          estado: 'en_proceso',
        })
        .eq('id', solicitud.id)
        .eq('estado', 'abierta')
        .is('prestador_id', null)
        .select('id')
        .maybeSingle()

      if (updateError) throw updateError

      if (!taken) {
        alert('Este trabajo ya fue tomado por otro prestador (o no está disponible).')
        await loadData()
        return
      }

      // 2) Descontar créditos
      const { error: creditosError } = await supabase
        .from('usuarios')
        .update({
          creditos_disponibles: usuario.creditos_disponibles - solicitud.costo_creditos,
        })
        .eq('id', usuario.id)

      if (creditosError) throw creditosError

      // 3) Registrar transacción
      await (supabase.from('transacciones') as any).insert({
        solicitud_id: solicitud.id,
        prestador_id: usuario.id,
        cliente_id: solicitud.cliente_id,
        tipo: 'uso_creditos',
        creditos: -solicitud.costo_creditos,
        estado_pago: 'aprobado',
      })

      alert('¡Trabajo tomado! Ahora podés ver los datos de contacto del productor.')
      setSelectedSolicitud(null)
      setTab('trabajos')
      await loadData()
    } catch (error) {
      console.error('Error tomando trabajo:', error)
      alert('Error al tomar el trabajo')
    } finally {
      setLoading(false)
    }
  }

  const handleComprarPack = async (pack: Pack) => {
    if (!usuario) {
      alert('No se cargó el perfil del prestador.')
      return
    }

    if (!confirm(`¿Comprar ${pack.cantidad_creditos} créditos por $${pack.precio_ars}?`)) {
      return
    }

    try {
      setLoading(true)

      const resp = await fetch('/api/mp/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          prestadorId: usuario.id,
        }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        console.error('Error /api/mp/preference:', data)
        alert(data?.error || 'Error creando preferencia de MercadoPago.')
        return
      }

      const initPoint = data?.init_point
      if (!initPoint) {
        console.error('Respuesta sin init_point:', data)
        alert('MercadoPago no devolvió init_point.')
        return
      }

      window.location.href = initPoint
    } catch (e) {
      console.error('Error comprando pack:', e)
      alert('Error iniciando compra de créditos.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Panel de Prestador</h1>
              <p className="text-gray-600">{usuario?.nombre}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
                <Coins className="w-5 h-5 text-primary-600" />
                <span className="font-bold text-primary-700">{usuario?.creditos_disponibles} créditos</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setTab('buscar')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                tab === 'buscar'
                  ? 'border-primary-600 text-primary-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Buscar Trabajos
            </button>
            <button
              onClick={() => setTab('trabajos')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                tab === 'trabajos'
                  ? 'border-primary-600 text-primary-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Mis Trabajos ({misSolicitudes.length})
            </button>
            <button
              onClick={() => setTab('creditos')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                tab === 'creditos'
                  ? 'border-primary-600 text-primary-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Comprar Créditos
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tab: Buscar Trabajos */}
        {tab === 'buscar' && (
          <>
            {/* Filters */}
            <div className="card mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Filtros</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo de servicio</label>
                  <select
                    className="input"
                    value={filters.tipo_servicio}
                    onChange={(e) => setFilters({ ...filters, tipo_servicio: e.target.value })}
                  >
                    <option value="">Todos mis servicios</option>
                    {SERVICIOS.filter((s) => usuario?.servicios_ofrecidos?.includes(s.value)).map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Distancia máxima</label>
                  <select
                    className="input"
                    value={filters.distancia_max}
                    onChange={(e) => setFilters({ ...filters, distancia_max: Number(e.target.value) })}
                  >
                    <option value={0}>Cualquier distancia</option>
                    <option value={50}>Hasta 50 km</option>
                    <option value={100}>Hasta 100 km</option>
                    <option value={200}>Hasta 200 km</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Solicitudes disponibles */}
            <div className="space-y-4">
              {filteredSolicitudes.map((solicitud) => {
                const servicio = SERVICIOS.find((s) => s.value === solicitud.tipo_servicio)

                return (
                  <div key={solicitud.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{servicio?.icon}</div>
                        <div>
                          <h3 className="text-xl font-bold">{servicio?.label}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {solicitud.localidad}, {solicitud.provincia}
                            <span className="text-primary-600 font-semibold">
                              ({solicitud.distancia?.toFixed(0)} km)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Costo</div>
                        <div className="text-2xl font-bold text-primary-600">
                          {solicitud.costo_creditos} créditos
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{solicitud.descripcion}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      {solicitud.hectareas && (
                        <div>
                          <div className="text-gray-600">Hectáreas</div>
                          <div className="font-semibold">{solicitud.hectareas}</div>
                        </div>
                      )}
                      {solicitud.toneladas && (
                        <div>
                          <div className="text-gray-600">Toneladas</div>
                          <div className="font-semibold">{solicitud.toneladas}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-gray-600">Fecha necesaria</div>
                        <div className="font-semibold">
                          {new Date(solicitud.fecha_necesaria).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                      {solicitud.presupuesto_estimado && (
                        <div>
                          <div className="text-gray-600">Presupuesto</div>
                          <div className="font-semibold">
                            ${solicitud.presupuesto_estimado.toLocaleString('es-AR')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setSelectedSolicitud(solicitud)} className="btn-secondary flex-1">
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => handleTomarTrabajo(solicitud)}
                        disabled={usuario!.creditos_disponibles < solicitud.costo_creditos}
                        className="btn-primary flex-1"
                      >
                        Tomar Trabajo
                      </button>
                    </div>
                  </div>
                )
              })}

              {filteredSolicitudes.length === 0 && (
                <div className="card text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay trabajos disponibles</h3>
                  <p className="text-gray-600">Probá ajustando los filtros</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab: Mis Trabajos */}
        {tab === 'trabajos' && (
          <div className="space-y-4">
            {misSolicitudes.map((solicitud) => {
              const servicio = SERVICIOS.find((s) => s.value === solicitud.tipo_servicio)
              const cliente = Array.isArray((solicitud as any).cliente)
                ? (solicitud as any).cliente[0]
                : (solicitud as any).cliente

              const whatsappText = `Hola, soy ${usuario?.nombre}. Tomé tu solicitud de ${
                servicio?.label ?? 'servicio'
              } en ${solicitud.localidad}, ${solicitud.provincia}. ¿Cuándo podemos coordinar?`

              return (
                <div key={solicitud.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{servicio?.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold">{servicio?.label}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {solicitud.localidad}, {solicitud.provincia}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                      En Proceso
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{solicitud.descripcion}</p>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">Datos del Productor:</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <strong>Nombre:</strong> {cliente?.nombre ?? '—'}
                      </div>
                      <div>
                        <strong>Email:</strong> {cliente?.email ?? '—'}
                      </div>
                      <div>
                        <strong>Teléfono:</strong> {cliente?.telefono ?? '—'}
                      </div>
                    </div>

                    {cliente?.telefono ? (
                      <a
                        className="btn-primary w-full mt-3"
                        href={buildWhatsAppUrl(cliente.telefono, whatsappText)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Contactar por WhatsApp
                      </a>
                    ) : (
                      <button className="btn-secondary w-full mt-3" disabled>
                        El productor no cargó teléfono
                      </button>
                    )}
                  </div>

                  <button className="btn-primary w-full">Marcar como Completado</button>
                </div>
              )
            })}

            {misSolicitudes.length === 0 && (
              <div className="card text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No tenés trabajos asignados</h3>
                <p className="text-gray-600 mb-4">Buscá trabajos disponibles y tomalos</p>
                <button onClick={() => setTab('buscar')} className="btn-primary">
                  Buscar Trabajos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Comprar Créditos */}
        {tab === 'creditos' && (
          <>
            <div className="mb-8 card bg-primary-50 border-primary-200">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold">Tus Créditos</h2>
              </div>
              <div className="text-4xl font-bold text-primary-700 mb-2">{usuario?.creditos_disponibles} créditos</div>
              <p className="text-gray-700">Usá créditos para tomar trabajos. Cada servicio tiene un costo diferente.</p>
            </div>

            <h3 className="text-2xl font-bold mb-6">Packs Disponibles</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packs.map((pack) => {
                const precioOriginal =
                  pack.descuento_porcentaje > 0
                    ? pack.precio_ars / (1 - pack.descuento_porcentaje / 100)
                    : pack.precio_ars

                return (
                  <div
                    key={pack.id}
                    className={`card ${pack.popular ? 'ring-2 ring-primary-500' : ''} hover:shadow-lg transition-shadow`}
                  >
                    {pack.popular && (
                      <div className="bg-primary-600 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">
                        Más Popular
                      </div>
                    )}
                    <h4 className="text-xl font-bold mb-2">{pack.nombre}</h4>
                    <div className="text-4xl font-bold text-primary-600 mb-4">
                      {pack.cantidad_creditos}
                      <span className="text-lg text-gray-600"> créditos</span>
                    </div>

                    {pack.descuento_porcentaje > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-500 line-through">${precioOriginal.toLocaleString('es-AR')}</span>
                        <span className="ml-2 text-sm font-bold text-green-600">{pack.descuento_porcentaje}% OFF</span>
                      </div>
                    )}

                    <div className="text-3xl font-bold mb-4">${pack.precio_ars.toLocaleString('es-AR')}</div>

                    <button onClick={() => handleComprarPack(pack)} className="btn-primary w-full">
                      Comprar
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal Detalles Solicitud */}
      {selectedSolicitud && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Detalles del Trabajo</h2>

            <div className="space-y-4 mb-6">
              <div>
                <strong>Tipo:</strong> {SERVICIOS.find((s) => s.value === selectedSolicitud.tipo_servicio)?.label}
              </div>
              <div>
                <strong>Descripción:</strong> {selectedSolicitud.descripcion}
              </div>
              <div>
                <strong>Ubicación:</strong> {selectedSolicitud.localidad}, {selectedSolicitud.provincia}
              </div>
              <div>
                <strong>Distancia:</strong> {selectedSolicitud.distancia?.toFixed(0)} km
              </div>
              <div>
                <strong>Costo:</strong> {selectedSolicitud.costo_creditos} créditos
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-900 mb-1">Datos de Contacto Bloqueados</div>
                  <p className="text-sm text-yellow-800">
                    Para ver los datos de contacto del productor, primero debés tomar el trabajo. Se descontarán{' '}
                    {selectedSolicitud.costo_creditos} créditos de tu cuenta.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedSolicitud(null)} className="btn-secondary flex-1">
                Cerrar
              </button>
              <button
                onClick={() => handleTomarTrabajo(selectedSolicitud)}
                disabled={usuario!.creditos_disponibles < selectedSolicitud.costo_creditos}
                className="btn-primary flex-1"
              >
                Tomar Trabajo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
