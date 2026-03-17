'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Status = 'success' | 'failure' | 'pending' | 'unknown'

export default function MpReturnPage() {
  const [status, setStatus] = useState<Status>('unknown')
  const [tx, setTx] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rawStatus = (params.get('status') || 'unknown') as Status
    const safeStatus: Status =
      rawStatus === 'success' || rawStatus === 'failure' || rawStatus === 'pending'
        ? rawStatus
        : 'unknown'

    setStatus(safeStatus)
    setTx(params.get('tx'))
  }, [])

  const ui = useMemo(() => {
    switch (status) {
      case 'success':
        return {
          title: 'Pago aprobado',
          desc: '¡Listo! Si el webhook ya impactó, tus créditos deberían verse reflejados al volver al panel. Si no, esperá unos segundos y recargá.',
          tone: 'border-green-200 bg-green-50 text-green-800',
        }
      case 'pending':
        return {
          title: 'Pago pendiente',
          desc: 'El pago quedó pendiente. Cuando MercadoPago lo apruebe, el webhook va a acreditar los créditos.',
          tone: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        }
      case 'failure':
        return {
          title: 'Pago rechazado / cancelado',
          desc: 'El pago fue rechazado o cancelado. Podés intentar de nuevo con otro medio de pago.',
          tone: 'border-red-200 bg-red-50 text-red-800',
        }
      default:
        return {
          title: 'Estado de pago',
          desc: 'No se pudo determinar el estado del pago desde la URL. Volvé al panel y verificá si impactaron los créditos.',
          tone: 'border-gray-200 bg-gray-50 text-gray-800',
        }
    }
  }, [status])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full bg-white border rounded-xl shadow-sm p-6">
        <div className={`border rounded-lg p-4 mb-5 ${ui.tone}`}>
          <h1 className="text-xl font-bold mb-1">{ui.title}</h1>
          <p className="text-sm leading-relaxed">{ui.desc}</p>
        </div>

        <div className="text-sm text-gray-700 space-y-2 mb-6">
          <div>
            <span className="font-semibold">Status:</span> {status}
          </div>
          {tx && (
            <div>
              <span className="font-semibold">Transacción (tx):</span> {tx}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/prestador"
            className="btn-primary text-center flex-1"
          >
            Volver al panel
          </Link>

          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-5">
          Tip: si volviste con <code>success</code> pero no ves créditos, esperá 10–30s y recargá.
        </p>
      </div>
    </div>
  )
}
