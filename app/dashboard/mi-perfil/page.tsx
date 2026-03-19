'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Usuario = {
  id: string
  email: string | null
  tipo: 'cliente' | 'prestador'
  nombre: string | null
  telefono: string | null
  provincia: string | null
  localidad: string | null
  descripcion: string | null
  servicios_ofrecidos: string[] | null
}

const SERVICIOS = [
  { value: 'pulverizacion', label: 'Pulverización' },
  { value: 'siembra', label: 'Siembra' },
  { value: 'cosecha', label: 'Cosecha' },
  { value: 'flete', label: 'Flete' },
] as const

export default function MiPerfilPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const [usuario, setUsuario] = useState<Usuario | null>(null)

  // Campos editables
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [provincia, setProvincia] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [servicios, setServicios] = useState<string[]>([])

  const isPrestador = useMemo(() => usuario?.tipo === 'prestador', [usuario?.tipo])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      setOkMsg(null)

      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr) {
        setError(authErr.message)
        setLoading(false)
        return
      }
      if (!authData.user) {
        router.push('/auth/login')
        return
      }

      const { data: u, error: uErr } = await supabase
        .from('usuarios')
        .select('id,email,tipo,nombre,telefono,provincia,localidad,descripcion,servicios_ofrecidos')
        .eq('id', authData.user.id)
        .single()

      if (uErr) {
        setError(uErr.message)
        setLoading(false)
        return
      }

      const usuarioRow = u as Usuario
      setUsuario(usuarioRow)

      setNombre(usuarioRow.nombre ?? '')
      setTelefono(usuarioRow.telefono ?? '')
      setProvincia(usuarioRow.provincia ?? '')
      setLocalidad(usuarioRow.localidad ?? '')
      setDescripcion(usuarioRow.descripcion ?? '')
      setServicios(usuarioRow.servicios_ofrecidos ?? [])

      setLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleServicio = (value: string) => {
    setServicios((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]))
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return

    setSaving(true)
    setError(null)
    setOkMsg(null)

    try {
      const payload: Partial<Usuario> = {
        nombre: nombre.trim() || null,
        telefono: telefono.trim() || null,
        provincia: provincia.trim() || null,
        localidad: localidad.trim() || null,
        descripcion: descripcion.trim() || null,
      }

      if (usuario.tipo === 'prestador') {
        payload.servicios_ofrecidos = servicios
      }

      const { data: updated, error: upErr } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', usuario.id)
        .select('id,email,tipo,nombre,telefono,provincia,localidad,descripcion,servicios_ofrecidos')
        .single()

      if (upErr) throw upErr

      const usuarioUpdated = updated as Usuario
      setUsuario(usuarioUpdated)

      setOkMsg('Perfil actualizado correctamente.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const volver = () => {
    if (!usuario) {
      router.push('/auth/login')
      return
    }
    router.push(usuario.tipo === 'prestador' ? '/dashboard/prestador' : '/dashboard/cliente')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Cargando perfil…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Mi Perfil</h1>
            <p className="text-slate-600 mt-1">
              Estos datos son los que se comparten cuando hay una solicitud asignada.
            </p>
          </div>

          <button
            onClick={volver}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            Volver
          </button>
        </div>

        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}
          {okMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              {okMsg}
            </div>
          )}

          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email (solo lectura)</label>
              <input
                value={usuario?.email ?? ''}
                readOnly
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                Si querés cambiar el email, conviene hacerlo luego con un flujo específico (Supabase Auth).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Tu nombre / razón social"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="+54911..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Recomendado: formato internacional (+54…). Si cargan local, igual lo podemos normalizar para WhatsApp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Provincia</label>
                <input
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Buenos Aires, Córdoba…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Localidad</label>
                <input
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Pergamino, Río Cuarto…"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Información útil para coordinar (horarios, referencias, etc.)"
                rows={4}
              />
            </div>

            {isPrestador && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Servicios ofrecidos</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICIOS.map((s) => (
                    <label
                      key={s.value}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={servicios.includes(s.value)}
                        onChange={() => toggleServicio(s.value)}
                      />
                      <span className="text-slate-800">{s.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Esto afecta qué trabajos ves en “Buscar Trabajos”.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={volver}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Tip: Probalo en Preview (mp-test) para no afectar producción.
        </div>
      </div>
    </div>
  )
}
