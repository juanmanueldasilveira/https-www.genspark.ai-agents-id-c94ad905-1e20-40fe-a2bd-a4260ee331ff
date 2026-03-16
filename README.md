# 🌾 AgroConnect Argentina

Marketplace geolocalizado de servicios agropecuarios para conectar productores con prestadores de servicios en toda Argentina.

## 🚀 Características Principales

### ✅ Para Productores (Clientes)
- ✅ Registro y publicación **100% GRATUITA**
- ✅ Geolocalización automática por provincia argentina (24 provincias)
- ✅ Publicar solicitudes de servicios con detalles completos
- ✅ Seguimiento en tiempo real de solicitudes
- ✅ Datos de contacto del prestador asignado
- ✅ Sin comisiones ni costos ocultos

### ✅ Para Prestadores de Servicios
- ✅ Sistema de créditos prepagos con packs y descuentos
- ✅ Búsqueda geolocalizada con filtros avanzados (servicio, distancia)
- ✅ **Pago PREVIO obligatorio** vía MercadoPago
- ✅ Cálculo automático de distancias (fórmula Haversine)
- ✅ Canon diferenciado por categoría (6%-12%)
- ✅ Dashboard completo con estadísticas
- ✅ **Bloqueo de contacto hasta pago confirmado** (anti-abuso)

### 🛠️ Servicios Disponibles
- 🚜 **Pulverización** - Aplicación de fitosanitarios (8% canon)
- 🌱 **Siembra** - Siembra directa y convencional (10% canon)
- 🌾 **Cosecha** - Cosecha de granos y oleaginosas (12% canon)
- 🚛 **Flete** - Transporte de granos e insumos (6% canon)

## 🏗️ Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Base de Datos**: Supabase (PostgreSQL + Auth + Realtime)
- **Pagos**: MercadoPago Checkout Pro
- **Geolocalización**: Haversine + 24 provincias argentinas
- **Styling**: Tailwind CSS
- **Lenguaje**: TypeScript
- **Deploy**: Vercel (recomendado)

## 📦 Estructura del Proyecto

```
agroconnect-argentina/
├── app/
│   ├── api/mp/           # API Routes MercadoPago
│   │   ├── preference/   # Crear preferencias de pago
│   │   └── webhook/      # Recibir notificaciones de pago
│   ├── auth/             # Autenticación
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/        # Dashboards
│   │   ├── cliente/      # Panel productor
│   │   └── prestador/    # Panel prestador
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── lib/
│   ├── geo/              # Geolocalización Argentina
│   └── supabase/         # Cliente Supabase
├── supabase/
│   └── migrations/       # Migraciones SQL
├── types/
│   └── supabase.ts       # Tipos TypeScript
└── ...configs
```

## 🗄️ Modelo de Datos

### Tablas

**usuarios**
- Autenticación con Supabase Auth
- Tipos: `cliente` | `prestador`
- Geolocalización por provincia
- Créditos disponibles (prestadores)

**solicitudes**
- Estado: `abierta` | `en_proceso` | `completada` | `cancelada`
- Relación con cliente y prestador
- Costo en créditos

**transacciones**
- Tipo: `compra_creditos` | `uso_creditos` | `pago_canon`
- Estado: `pendiente` | `aprobado` | `rechazado`
- Integración con MercadoPago

**packs_creditos**
- 4 packs con descuentos progresivos (0%, 13%, 23%, 33%)

**configuracion_canon**
- Configuración por tipo de servicio
- % canon + créditos base + créditos por hectárea

## 🚀 Instalación Local

### Prerequisitos
- Node.js 18+
- npm o yarn
- Cuenta Supabase
- Cuenta MercadoPago Argentina

### Pasos

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd agroconnect-argentina
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Copiar `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

Completar con tus credenciales (ver DEPLOYMENT.md para detalles).

4. **Ejecutar migraciones en Supabase**

Copiar el contenido de `supabase/migrations/*.sql` y ejecutar en el SQL Editor de Supabase.

5. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🌐 Despliegue en Producción

Ver **[DEPLOYMENT.md](./DEPLOYMENT.md)** para instrucciones detalladas de despliegue en Vercel + Supabase + MercadoPago.

### Resumen rápido:

1. **Supabase**:
   - Crear proyecto
   - Ejecutar migraciones SQL
   - Configurar Auth
   - Obtener URL + Keys

2. **MercadoPago**:
   - Crear aplicación
   - Obtener credenciales producción
   - Configurar webhook

3. **Vercel**:
   - Conectar repositorio
   - Configurar variables de entorno
   - Deploy automático

## 🔐 Seguridad

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Autenticación con Supabase Auth
- ✅ Validación de roles (cliente/prestador)
- ✅ Bloqueo de contacto hasta pago confirmado
- ✅ Idempotencia en webhooks de MercadoPago
- ✅ Variables sensibles en servidor (Access Token MP)

## 🧪 Testing

### Credenciales de Prueba MercadoPago

Para testing, usar las tarjetas de prueba de MercadoPago:
- **Visa aprobada**: 4509 9535 6623 3704
- **CVV**: 123
- **Fecha**: cualquier fecha futura

Ver: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/cards

## 📱 Funcionalidades Implementadas

### Sistema Pay-First (Pago Previo)
- ✅ Datos de contacto bloqueados en búsqueda
- ✅ Modal muestra "Datos Bloqueados" con candado
- ✅ Validación de créditos antes de tomar trabajo
- ✅ Descuento automático al tomar trabajo
- ✅ Desbloqueo de contacto post-pago

### Geolocalización
- ✅ 24 provincias argentinas con coordenadas
- ✅ Cálculo de distancia con fórmula Haversine
- ✅ Filtros por distancia (50/100/200 km)
- ✅ Ordenamiento por cercanía

### Sistema de Créditos
- ✅ 4 packs con descuentos progresivos
- ✅ Cálculo dinámico según servicio + hectáreas
- ✅ Dashboard con créditos disponibles
- ✅ Historial de transacciones

### Integración MercadoPago
- ✅ API Route para crear preferencias
- ✅ API Route webhook para confirmar pagos
- ✅ Redirecciones success/failure/pending
- ✅ Actualización automática de créditos
- ✅ Idempotencia en procesamiento

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run lint         # Linter
```

## 📖 Documentación Adicional

- **DEPLOYMENT.md** - Guía completa de despliegue paso a paso
- **Supabase Docs** - https://supabase.com/docs
- **MercadoPago Docs** - https://www.mercadopago.com.ar/developers
- **Next.js Docs** - https://nextjs.org/docs

## 🤝 Contribuir

Este es un proyecto MVP. Para mejoras y sugerencias, abrir un issue.

## 📄 Licencia

MIT

---

**Desarrollado para conectar el campo argentino 🇦🇷🌾**
