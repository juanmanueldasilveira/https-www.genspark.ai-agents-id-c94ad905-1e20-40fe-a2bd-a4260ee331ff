'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PROVINCIAS_ARGENTINA, getProvinciaCoords } from '@/lib/geo/argentina'
import { Plus, LogOut, MapPin, FileText, User } from 'lucide-react'

type Usuario = {
  id: string
  nombre: string
  email: string
  provincia: string
  localidad: string
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
  estado: string
  presupuesto_estimado: number | null
  costo_creditos: number
  prestador_id: string | null
  created_at: string
}

const SERVICIOS = [
  { value: 'pulverizacion', label: 'Pulverización', icon: '🚜' },
  { value: 'siembra', label: 'Siembra', icon: '🌱' },
  { value: 'cosecha', label: 'Cosecha', icon: '🌾' },
  { value: 'flete', label: 'Flete', icon: '🚛' },
]

const ESTADOS = {
  abierta: { label: 'Abierta', color: 'bg-blue-100 text-blue-800' },
  en_proceso: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800' },
  completada: { label: 'Completada', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
}

export default function ClienteDashboard() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    tipo_servicio: '',
    descripcion: '',
    hectareas: '',
    toneladas: '',
    fecha_necesaria: '',
    provincia: '',
    localidad: '',
    presupuesto_estimado: '',
  })

  useEffect(() => {
    loadData()
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
      if (usuarioData.tipo !== 'cliente') {
        router.push('/dashboard/prestador')
        return
      }

      setUsuario(usuarioData)

      // Load solicitudes
      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false })

      if (solicitudesError) throw solicitudesError
      setSolicitudes(solicitudesData || [])
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

  const calculateCostoCreditos = (tipoServicio: string, hectareas: number) => {
    // Base calculation - would be replaced with real logic from configuracion_canon
    const baseCosts = {
      pulverizacion: 2,
      siembra: 3,
      cosecha: 4,
      flete: 1,
    }
    const base = baseCosts[tipoServicio as keyof typeof baseCosts] || 1
    const porHectarea = hectareas * 0.02
    return Math.ceil(base + porHectarea)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!usuario) return

      const coords = getProvinciaCoords(formData.provincia)
      if (!coords) throw new Error('Provincia no válida')

      const costoCreditos = calculateCostoCreditos(
        formData.tipo_servicio,
        parseFloat(formData.hectareas) || 0
      )

      const { error } = await supabase.from('solicitudes').insert({
        cliente_id: usuario.id,
        tipo_servicio: formData.tipo_servicio,
        descripcion: formData.descripcion,
        hectareas: formData.hectareas ? parseFloat(formData.hectareas) : null,
        toneladas: formData.toneladas ? parseFloat(formData.toneladas) : null,
        fecha_necesaria: formData.fecha_necesaria,
        provincia: formData.provincia,
        localidad: formData.localidad,
        latitud: coords.lat,
        longitud: coords.lng,
        presupuesto_estimado: formData.presupuesto_estimado
          ? parseFloat(formData.presupuesto_estimado)
          : null,
        costo_creditos: costoCreditos,
        estado: 'abierta',
      })

      if (error) throw error

      setShowModal(false)
      setFormData({
        tipo_servicio: '',
        descripcion: '',
        hectareas: '',
        toneladas: '',
        fecha_necesaria: '',
        provincia: '',
        localidad: '',
        presupuesto_estimado: '',
      })
      loadData()
    } catch (error) {
      console.error('Error creating solicitud:', error)
      alert('Error al crear la solicitud')
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
              <h1 className="text-2xl font-bold">Panel de Productor</h1>
              <p className="text-gray-600">{usuario?.nombre}</p>
            </div>

            {/* ✅ Acciones header: Mi Perfil + Salir */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/mi-perfil')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <User className="w-5 h-5" />
                Mi Perfil
              </button>

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

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold">{solicitudes.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Abiertas</div>
            <div className="text-3xl font-bold text-blue-600">
              {solicitudes.filter((s) => s.estado === 'abierta').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">En Proceso</div>
            <div className="text-3xl font-bold text-yellow-600">
              {solicitudes.filter((s) => s.estado === 'en_proceso').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Completadas</div>
            <div className="text-3xl font-bold text-green-600">
              {solicitudes.filter((s) => s.estado === 'completada').length}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nueva Solicitud
          </button>
        </div>

        {/* Solicitudes List */}
        <div className="space-y-4">
          {solicitudes.map((solicitud) => {
            const servicio = SERVICIOS.find((s) => s.value === solicitud.tipo_servicio)
            const estado = ESTADOS[solicitud.estado as keyof typeof ESTADOS]

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
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${estado.color}`}>
                    {estado.label}
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{solicitud.descripcion}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
              </div>
            )
          })}

          {solicitudes.length === 0 && (
            <div className="card text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tenés solicitudes aún</h3>
              <p className="text-gray-600 mb-4">Creá tu primera solicitud para empezar</p>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                Crear Solicitud
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Solicitud */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Nueva Solicitud de Servicio</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Tipo de Servicio</label>
                <select
                  required
                  className="input"
                  value={formData.tipo_servicio}
                  onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
                >
                  <option value="">Seleccionar servicio</option>
                  {SERVICIOS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.icon} {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Descripción del trabajo</label>
                <textarea
                  required
                  rows={3}
                  className="input"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detallá qué necesitás..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Hectáreas</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.hectareas}
                    onChange={(e) => setFormData({ ...formData, hectareas: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Toneladas (para flete)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.toneladas}
                    onChange={(e) => setFormData({ ...formData, toneladas: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Fecha necesaria</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.fecha_necesaria}
                  onChange={(e) => setFormData({ ...formData, fecha_necesaria: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Provincia</label>
                  <select
                    required
                    className="input"
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  >
                    <option value="">Seleccionar</option>
                    {PROVINCIAS_ARGENTINA.map((p) => (
                      <option key={p.nombre} value={p.nombre}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Localidad</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.localidad}
                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Presupuesto estimado (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="$"
                  value={formData.presupuesto_estimado}
                  onChange={(e) => setFormData({ ...formData, presupuesto_estimado: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creando...' : 'Crear Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
