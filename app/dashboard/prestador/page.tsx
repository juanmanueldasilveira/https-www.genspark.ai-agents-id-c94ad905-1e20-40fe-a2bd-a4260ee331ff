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
