'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { PROVINCIAS_ARGENTINA, getProvinciaCoords } from '@/lib/geo/argentina'

type TipoUsuario = 'cliente' | 'prestador'

const SERVICIOS = ['pulverizacion', 'siembra', 'cosecha', 'flete']

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipoParam = searchParams.get('tipo') as TipoUsuario | null
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tipo, setTipo] = useState<TipoUsuario>(tipoParam || 'cliente')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
    provincia: '',
    localidad: '',
    descripcion: '',
    servicios_ofrecidos: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      // 2. Get provincia coordinates
      const coords = getProvinciaCoords(formData.provincia)
      if (!coords) throw new Error('Provincia no válida')

      // 3. Create usuario profile
      const { error: profileError } = await supabase.from('usuarios').insert({
        id: authData.user.id,
        email: formData.email,
        nombre: formData.nombre,
        telefono: formData.telefono || null,
        tipo,
        provincia: formData.provincia,
        localidad: formData.localidad,
        latitud: coords.lat,
        longitud: coords.lng,
        descripcion: formData.descripcion || null,
        servicios_ofrecidos: tipo === 'prestador' ? formData.servicios_ofrecidos : null,
        creditos_disponibles: 0,
        activo: true,
      })

      if (profileError) throw profileError

      // 4. Redirect to appropriate dashboard
      router.push(tipo === 'cliente' ? '/dashboard/cliente' : '/dashboard/prestador')
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const toggleServicio = (servicio: string) => {
    setFormData(prev => ({
      ...prev,
      servicios_ofrecidos: prev.servicios_ofrecidos.includes(servicio)
        ? prev.servicios_ofrecidos.filter(s => s !== servicio)
        : [...prev.servicios_ofrecidos, servicio]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Crear Cuenta</h1>
          <p className="text-gray-600">Unite a AgroConnect Argentina</p>
        </div>

        <div className="card">
          {/* Tipo de usuario */}
          <div className="mb-6">
            <label className="label">Soy:</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTipo('cliente')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipo === 'cliente'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-3xl mb-2">🌾</div>
                <div className="font-semibold">Productor</div>
                <div className="text-sm text-gray-600">Necesito servicios</div>
              </button>
              <button
                type="button"
                onClick={() => setTipo('prestador')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipo === 'prestador'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-3xl mb-2">🚜</div>
                <div className="font-semibold">Prestador</div>
                <div className="text-sm text-gray-600">Ofrezco servicios</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="label">Nombre completo / Empresa</label>
              <input
                type="text"
                required
                className="input"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            {/* Telefono */}
            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                className="input"
                placeholder="+54 9 11 1234-5678"
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>

            {/* Provincia */}
            <div>
              <label className="label">Provincia</label>
              <select
                required
                className="input"
                value={formData.provincia}
                onChange={e => setFormData({ ...formData, provincia: e.target.value })}
              >
                <option value="">Seleccionar provincia</option>
                {PROVINCIAS_ARGENTINA.map(p => (
                  <option key={p.nombre} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Localidad */}
            <div>
              <label className="label">Localidad</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Ciudad o partido"
                value={formData.localidad}
                onChange={e => setFormData({ ...formData, localidad: e.target.value })}
              />
            </div>

            {/* Servicios ofrecidos (solo para prestadores) */}
            {tipo === 'prestador' && (
              <div>
                <label className="label">Servicios que ofrezco (seleccionar al menos uno)</label>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICIOS.map(servicio => (
                    <label
                      key={servicio}
                      className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.servicios_ofrecidos.includes(servicio)}
                        onChange={() => toggleServicio(servicio)}
                        className="w-4 h-4"
                      />
                      <span className="capitalize">{servicio}</span>
                    </label>
                  ))}
                </div>
                {tipo === 'prestador' && formData.servicios_ofrecidos.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">Selecciona al menos un servicio</p>
                )}
              </div>
            )}

            {/* Descripción */}
            <div>
              <label className="label">
                {tipo === 'cliente' ? 'Sobre mi campo' : 'Sobre mi empresa'}
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder={
                  tipo === 'cliente'
                    ? 'Breve descripción de tu campo o actividad'
                    : 'Equipamiento, experiencia, zona de cobertura'
                }
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (tipo === 'prestador' && formData.servicios_ofrecidos.length === 0)}
              className="btn-primary w-full"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tenés cuenta?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
