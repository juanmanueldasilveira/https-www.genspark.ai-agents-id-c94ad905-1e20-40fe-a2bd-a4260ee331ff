import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get pack_id from request
    const { pack_id } = await request.json()
    if (!pack_id) {
      return NextResponse.json({ error: 'pack_id requerido' }, { status: 400 })
    }

    // Get pack details
    const { data: pack, error: packError } = await supabase
      .from('packs_creditos')
      .select('*')
      .eq('id', pack_id)
      .single()

    if (packError || !pack) {
      return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 })
    }

    // Get user details
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Create preference
    const preference = new Preference(client)
    
    const preferenceData = {
      items: [
        {
          id: pack.id,
          title: `${pack.nombre} - ${pack.cantidad_creditos} créditos`,
          description: `Pack de créditos para AgroConnect Argentina`,
          quantity: 1,
          unit_price: pack.precio_ars,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: usuario.email,
        name: usuario.nombre,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/prestador?payment=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/prestador?payment=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/prestador?payment=pending`,
      },
      auto_return: 'approved' as const,
      external_reference: `${user.id}-${pack.id}-${Date.now()}`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mp/webhook`,
      statement_descriptor: 'AGROCONNECT',
      metadata: {
        user_id: user.id,
        pack_id: pack.id,
        cantidad_creditos: pack.cantidad_creditos,
      },
    }

    const result = await preference.create({ body: preferenceData })

    // Create pending transaction
    await supabase.from('transacciones').insert({
      prestador_id: user.id,
      tipo: 'compra_creditos',
      monto_ars: pack.precio_ars,
      creditos: pack.cantidad_creditos,
      estado_pago: 'pendiente',
      metodo_pago: 'mercadopago',
      mp_preference_id: result.id,
    })

    return NextResponse.json({
      init_point: result.init_point,
      preference_id: result.id,
    })
  } catch (error) {
    console.error('Error creating preference:', error)
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago' },
      { status: 500 }
    )
  }
}
