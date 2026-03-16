'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Status = 'success' | 'failure' | 'pending' | 'unknown'

export default function MpReturnPage() {
  const [status, setStatus] = useState<Status>('unknown')
  const [tx, setTx] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = (params.get('status') || 'unknown') as Status
    setStatus(['success', 'failure', 'pending', 'unknown'].includes(s) ? s : 'unknown')
    setTx(params.get('tx'))
  }, [])

  const ui = useMemo(() => {
    if (status === 'success') {
      return {
        title: 'Pago aprobado',
        desc: 'Listo. Si el webhook ya impactó, tus créditos deberían verse reflejados al volver al panel. Si no, esperá unos segundos y recargá.',
      }
    }
    if (status === 'pending') {
      return {
        title: 'Pago pendiente',
        desc: 'El pago quedó pendiente. Cuando MercadoPago lo apruebe, el webhook va a acreditar los créditos.',
      }
    }
    if (status === 'failure') {
      return {
        title: 'Pago rechazado',
        desc: 'El pago fue rechazado o cancelado. Podés intentar de nuevo con otro medio de pago.',
      }
    }
    return {
      title: 'Estado de pago',
      desc: 'No se pudo determinar el estado. Volvé al panel y verificá si impactaron los créditos.',
    }
  }, [status])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-2">{ui.title}</h1>
        <p className="text-gray-700 mb-4">{ui.desc}</p>

        {tx && (
          <div className="text-sm text-gray-600 mb-6">
            <span className="font-semibold">Transacción:</span> {tx}
          </div>
        )}

        <div className="flex gap-3">
          <Link className="btn-primary flex-1 text-center" href="/dashboard/prestador">
            Volver al panel
          </Link>

          <button className="btn-secondary flex-1" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      </div>
    </div>
  )
}
