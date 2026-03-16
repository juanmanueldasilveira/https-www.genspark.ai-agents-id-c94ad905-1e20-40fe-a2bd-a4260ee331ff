import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get notification data
    const body = await request.json()
    
    console.log('MercadoPago webhook received:', body)

    // Validate notification type
    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    // Get payment details
    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'payment_id no encontrado' }, { status: 400 })
    }

    // Fetch payment from MercadoPago
    const payment = new Payment(client)
    const paymentData = await payment.get({ id: paymentId })

    console.log('Payment data:', paymentData)

    // Only process approved payments
    if (paymentData.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    // Get external_reference to extract user_id and pack_id
    const externalReference = paymentData.external_reference
    if (!externalReference) {
      console.error('No external_reference found')
      return NextResponse.json({ ok: true })
    }

    const [userId, packId] = externalReference.split('-')

    // Get pack details
    const { data: pack, error: packError } = await supabase
      .from('packs_creditos')
      .select('*')
      .eq('id', packId)
      .single()

    if (packError || !pack) {
      console.error('Pack not found:', packId)
      return NextResponse.json({ ok: true })
    }

    // Check if transaction already exists (idempotency)
    const { data: existingTransaction } = await supabase
      .from('transacciones')
      .select('*')
      .eq('mp_payment_id', paymentId)
      .single()

    if (existingTransaction) {
      console.log('Transaction already processed')
      return NextResponse.json({ ok: true })
    }

    // Update or create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transacciones')
      .upsert(
        {
          prestador_id: userId,
          tipo: 'compra_creditos',
          monto_ars: pack.precio_ars,
          creditos: pack.cantidad_creditos,
          estado_pago: 'aprobado',
          metodo_pago: 'mercadopago',
          mp_payment_id: paymentId,
        },
        {
          onConflict: 'mp_payment_id',
        }
      )
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: 'Error al crear transacción' }, { status: 500 })
    }

    // Add credits to user
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('creditos_disponibles')
      .eq('id', userId)
      .single()

    if (usuarioError || !usuario) {
      console.error('User not found:', userId)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        creditos_disponibles: usuario.creditos_disponibles + pack.cantidad_creditos,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating credits:', updateError)
      return NextResponse.json({ error: 'Error al actualizar créditos' }, { status: 500 })
    }

    console.log(`Credits added: ${pack.cantidad_creditos} to user ${userId}`)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    )
  }
}
