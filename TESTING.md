# 🧪 Guía de Testing - AgroConnect Argentina

Esta guía te ayudará a probar todas las funcionalidades del marketplace.

---

## 📋 Usuarios Demo Precargados

Para testing rápido, hemos creado usuarios demo (ejecutar script `003_demo_data.sql`):

### Clientes (Productores)

**Cliente 1 - Buenos Aires**
- Email: `cliente.demo@agroconnect.ar`
- Password: `demo123`
- Ubicación: Pergamino, Buenos Aires
- Tiene 3 solicitudes creadas

**Cliente 2 - Córdoba**
- Email: `cliente2.demo@agroconnect.ar`
- Password: `demo123`
- Ubicación: Marcos Juárez, Córdoba
- Tiene 1 solicitud creada

### Prestadores

**Prestador 1 - Multi-servicio**
- Email: `prestador.demo@agroconnect.ar`
- Password: `demo123`
- Servicios: Pulverización + Siembra
- Ubicación: Junín, Buenos Aires
- **Créditos: 15** (para testing)

**Prestador 2 - Cosecha**
- Email: `prestador2.demo@agroconnect.ar`
- Password: `demo123`
- Servicios: Siembra + Cosecha
- Ubicación: Bell Ville, Córdoba
- **Créditos: 8** (para testing)

**Prestador 3 - Flete**
- Email: `fletero.demo@agroconnect.ar`
- Password: `demo123`
- Servicios: Flete
- Ubicación: Rosario, Santa Fe
- **Créditos: 12** (para testing)

---

## 🧪 Casos de Prueba

### Test 1: Flujo Completo del Cliente

**Objetivo:** Verificar que un productor puede crear una solicitud

1. Login con `cliente.demo@agroconnect.ar`
2. Ver dashboard → debería mostrar estadísticas
3. Click en "Nueva Solicitud"
4. Completar formulario:
   - Servicio: Pulverización
   - Descripción: "Aplicación herbicida pre-siembra"
   - Hectáreas: 100
   - Fecha: próximos 7 días
   - Provincia: Buenos Aires
   - Localidad: Pergamino
5. Submit → debe aparecer en lista como "Abierta"
6. **Verificar:** Solicitud visible en el listado

---

### Test 2: Búsqueda de Trabajos (Prestador)

**Objetivo:** Verificar que prestadores pueden buscar trabajos

1. Login con `prestador.demo@agroconnect.ar`
2. Tab "Buscar Trabajos"
3. **Verificar:** Solo aparecen trabajos de Pulverización y Siembra (sus servicios)
4. Aplicar filtros:
   - Tipo: Pulverización
   - Distancia: 100 km
5. **Verificar:** Trabajos filtrados correctamente y ordenados por distancia
6. Click en "Ver Detalles"
7. **Verificar:** 
   - Modal muestra información del trabajo
   - Datos de contacto del cliente están **BLOQUEADOS** 🔒
   - Mensaje indica que debe tomar el trabajo primero

---

### Test 3: Sistema Pay-First (Bloqueo de Contacto)

**Objetivo:** Verificar que datos de contacto están bloqueados hasta pago

1. Login con `prestador.demo@agroconnect.ar` (15 créditos)
2. Buscar trabajo que cueste ≤ 15 créditos
3. Click en "Ver Detalles"
4. **Verificar:** 
   - Datos de contacto bloqueados
   - Icono de candado visible
   - Mensaje: "Para ver los datos de contacto..."
5. Click en "Tomar Trabajo"
6. Confirmar descuento de créditos
7. **Verificar:**
   - Créditos descontados (ej: 15 → 10 si costaba 5)
   - Trabajo ahora en "Mis Trabajos"
   - Datos de contacto ahora **VISIBLES** ✅

---

### Test 4: Compra de Créditos con MercadoPago

**Objetivo:** Verificar integración con MercadoPago

#### Modo TEST (desarrollo):

1. Login con un prestador
2. Tab "Comprar Créditos"
3. Elegir pack (ej: Estándar - 15 créditos)
4. Click "Comprar"
5. **Verificar:** Redirección a checkout MercadoPago
6. Usar tarjeta de prueba:
   - Número: `4509 9535 6623 3704`
   - CVV: `123`
   - Fecha: cualquier futura
   - Nombre: APRO
7. Completar pago
8. **Verificar:**
   - Redirección a dashboard con `?payment=success`
   - Créditos acreditados (webhook debe procesar en ~5 segundos)
   - Transacción registrada en dashboard

#### Verificar Webhook:
- En Vercel Logs, buscar: "MercadoPago webhook received"
- Debe mostrar status `approved`
- Debe acreditar créditos

---

### Test 5: Filtros y Geolocalización

**Objetivo:** Verificar cálculo de distancias

1. Login con `prestador.demo@agroconnect.ar` (Junín, Buenos Aires)
2. Tab "Buscar Trabajos"
3. **Verificar:** Cada trabajo muestra distancia en km
4. Filtrar por distancia: "Hasta 50 km"
5. **Verificar:** Solo aparecen trabajos cercanos
6. Cambiar filtro: "Hasta 200 km"
7. **Verificar:** Aparecen más trabajos
8. **Verificar:** Trabajos ordenados de menor a mayor distancia

---

### Test 6: Estados de Solicitudes

**Objetivo:** Verificar transiciones de estado

1. **Cliente** crea solicitud → Estado: `abierta`
2. **Prestador** toma trabajo → Estado: `en_proceso`
3. **Prestador** marca como completado → Estado: `completada`
4. **Cliente** puede cancelar si está `abierta`

**Verificar en cada paso:**
- Estado actualizado en ambos dashboards
- Colores correctos (azul/amarillo/verde/rojo)
- Permisos correctos (solo prestador asignado puede completar)

---

### Test 7: Sistema de Créditos

**Objetivo:** Verificar lógica de créditos

1. Login prestador con 10 créditos
2. Intentar tomar trabajo que cuesta 15 créditos
3. **Verificar:** 
   - Botón "Tomar Trabajo" deshabilitado
   - Mensaje: "No tenés suficientes créditos"
4. Comprar pack de créditos
5. Ahora con 25 créditos (10 + 15)
6. Tomar trabajo de 15 créditos
7. **Verificar:** Ahora tiene 10 créditos (25 - 15)

---

### Test 8: Cálculo de Costo por Servicio

**Objetivo:** Verificar que créditos se calculan correctamente

| Servicio | Base | Por Hectárea | Ejemplo (100 ha) |
|----------|------|--------------|------------------|
| Pulverización | 2 | 0.02 | 2 + (100 * 0.02) = 4 |
| Siembra | 3 | 0.025 | 3 + (100 * 0.025) = 5.5 ≈ 6 |
| Cosecha | 4 | 0.03 | 4 + (100 * 0.03) = 7 |
| Flete | 1 | 0 | 1 (fijo) |

**Crear solicitudes con diferentes hectáreas y verificar cálculos.**

---

### Test 9: Responsive Design

**Objetivo:** Verificar que funciona en móviles

1. Abrir en Chrome DevTools → Mobile view
2. Probar resoluciones:
   - 375px (iPhone)
   - 768px (iPad)
   - 1920px (Desktop)
3. **Verificar:**
   - Landing page se adapta
   - Formularios usables
   - Botones accesibles
   - Dashboards sin scroll horizontal

---

### Test 10: Seguridad y Permisos

**Objetivo:** Verificar Row Level Security (RLS)

**Como Cliente:**
- ✅ Puede ver sus propias solicitudes
- ❌ NO puede ver solicitudes de otros clientes (cerradas)
- ✅ Puede crear solicitudes
- ❌ NO puede acceder a dashboard de prestador

**Como Prestador:**
- ✅ Puede ver solicitudes abiertas
- ✅ Puede ver solicitudes que tomó
- ❌ NO puede ver datos de cliente antes de tomar trabajo
- ✅ Puede ver datos de cliente después de tomar trabajo
- ❌ NO puede acceder a dashboard de cliente

**Sin Login:**
- ❌ NO puede acceder a dashboards
- ✅ Puede ver landing page
- ✅ Puede registrarse

---

## 🐛 Troubleshooting Común

### "No se muestran solicitudes"
- Verificar que existen solicitudes en estado `abierta`
- Verificar filtros (tipo de servicio, distancia)
- Verificar que prestador tenga ese servicio en `servicios_ofrecidos`

### "Webhook no acredita créditos"
- Ver Vercel Logs → Runtime Logs
- Buscar errores en `/api/mp/webhook`
- Verificar que `external_reference` tenga formato correcto: `userId-packId-timestamp`
- Verificar idempotencia (no procesar dos veces el mismo payment_id)

### "Créditos no se descuentan"
- Verificar transacción creada en tabla `transacciones`
- Verificar que `tipo` sea `uso_creditos`
- Verificar que `creditos` sea negativo (ej: -5)

---

## 📊 Checklist de Testing Completo

Antes de lanzar a producción, verificar:

- [ ] Registro cliente funciona
- [ ] Registro prestador funciona
- [ ] Login funciona
- [ ] Cliente puede crear solicitud
- [ ] Prestador puede buscar trabajos
- [ ] Filtros funcionan (servicio, distancia)
- [ ] Distancias calculadas correctamente
- [ ] Datos de contacto bloqueados antes de tomar
- [ ] Datos de contacto visibles después de tomar
- [ ] Compra de créditos con MP funciona
- [ ] Webhook acredita créditos correctamente
- [ ] Créditos se descuentan al tomar trabajo
- [ ] Estados de solicitud cambian correctamente
- [ ] RLS funciona (permisos correctos)
- [ ] Responsive en móviles
- [ ] Sin errores en consola del navegador
- [ ] Sin errores en Vercel Runtime Logs

---

## 🎯 Métricas a Monitorear

En producción, trackear:

- **Conversión**: Registros → Primera solicitud/trabajo tomado
- **Tiempo promedio**: Desde solicitud publicada hasta tomada
- **Distancia promedio**: Entre prestador y trabajo
- **Pack más vendido**: Cuál pack compran más
- **Tasa de completación**: Trabajos tomados vs completados
- **Provincias más activas**: Dónde hay más actividad

---

**¡Happy Testing! 🧪**
