# 🎯 Quick Start - AgroConnect Argentina

Guía rápida para comenzar a desarrollar en minutos.

---

## ⚡ Setup en 5 Minutos

### 1. Clonar e Instalar

```bash
# Clonar
git clone <tu-repo>
cd agroconnect-argentina

# Instalar dependencias
npm install
```

### 2. Configurar Supabase Local

**Opción A: Usar proyecto cloud (recomendado para empezar)**

1. Crear proyecto en https://app.supabase.com
2. Ir a SQL Editor
3. Ejecutar en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
   - `supabase/migrations/003_demo_data.sql` (opcional, para testing)

**Opción B: Supabase local (para desarrollo avanzado)**

```bash
# Instalar CLI
npm install -g supabase

# Iniciar local
supabase start

# Aplicar migraciones
supabase db reset
```

### 3. Variables de Entorno

```bash
# Copiar template
cp .env.example .env.local

# Completar con tus credenciales
# Supabase: obtener de Project Settings → API
# MercadoPago: obtener de Developers → Credenciales de prueba
```

### 4. Correr en Desarrollo

```bash
npm run dev
```

Abrir http://localhost:3000

---

## 🏗️ Estructura del Proyecto

```
agroconnect-argentina/
│
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # API Routes (backend)
│   │   └── mp/                      # MercadoPago endpoints
│   │       ├── preference/route.ts  # Crear preferencias
│   │       └── webhook/route.ts     # Recibir pagos
│   │
│   ├── 📁 auth/                     # Autenticación
│   │   ├── login/page.tsx           # Login page
│   │   └── register/page.tsx        # Registro con tipo (cliente/prestador)
│   │
│   ├── 📁 dashboard/                # Dashboards por rol
│   │   ├── cliente/page.tsx         # Panel productor
│   │   └── prestador/page.tsx       # Panel prestador (buscar + tomar)
│   │
│   ├── globals.css                  # Estilos globales + Tailwind
│   ├── layout.tsx                   # Layout root
│   └── page.tsx                     # Landing page pública
│
├── 📁 lib/                          # Utilidades compartidas
│   ├── geo/argentina.ts             # Provincias + Haversine distance
│   └── supabase/
│       ├── client.ts                # Cliente Supabase (browser)
│       ├── server.ts                # Cliente Supabase (server)
│       └── middleware.ts            # Auth middleware
│
├── 📁 supabase/migrations/          # SQL migrations
│   ├── 001_initial_schema.sql       # Tablas + RLS
│   ├── 002_seed_data.sql            # Packs + config canon
│   └── 003_demo_data.sql            # Usuarios demo (opcional)
│
├── 📁 types/                        # TypeScript types
│   └── supabase.ts                  # Database types
│
├── 📄 .env.example                  # Template variables de entorno
├── 📄 .gitignore
├── 📄 middleware.ts                 # Next.js middleware (auth)
├── 📄 next.config.mjs               # Config Next.js
├── 📄 package.json
├── 📄 postcss.config.mjs
├── 📄 tailwind.config.ts
├── 📄 tsconfig.json
│
└── 📚 Documentación
    ├── README.md                    # Overview del proyecto
    ├── DEPLOYMENT.md                # Guía de despliegue completa
    └── TESTING.md                   # Guía de testing
```

---

## 🔑 Conceptos Clave

### Flujos Principales

**Productor (Cliente):**
```
Registro → Dashboard → Crear Solicitud → Esperar Prestador → Ver asignación → Completar
```

**Prestador:**
```
Registro → Comprar Créditos → Buscar Trabajos → Tomar Trabajo (pagar) → Ver Contacto → Completar
```

### Arquitectura de Datos

```
usuarios (Auth)
   ├── tipo: cliente | prestador
   └── creditos_disponibles (solo prestador)

solicitudes
   ├── estado: abierta | en_proceso | completada | cancelada
   ├── cliente_id → usuarios
   └── prestador_id → usuarios (nullable)

transacciones
   ├── tipo: compra_creditos | uso_creditos | pago_canon
   └── estado_pago: pendiente | aprobado | rechazado
```

### Cálculo de Créditos

```typescript
costo_creditos = creditos_base + (hectareas * creditos_por_hectarea)

Ejemplo Pulverización (150 ha):
  2 + (150 * 0.02) = 2 + 3 = 5 créditos
```

### Sistema Pay-First

1. Prestador busca trabajos → **contacto bloqueado** 🔒
2. Prestador toma trabajo → **descuenta créditos**
3. Trabajo asignado → **contacto desbloqueado** ✅
4. Transacción registrada en BD

---

## 🚀 Comandos Útiles

### Desarrollo

```bash
npm run dev           # Servidor desarrollo (http://localhost:3000)
npm run build         # Build producción
npm run start         # Servidor producción (después de build)
npm run lint          # Linter
```

### Supabase (si usas CLI local)

```bash
supabase start        # Iniciar local
supabase stop         # Detener
supabase status       # Ver URLs y keys locales
supabase db reset     # Reset DB + aplicar migraciones
supabase db diff      # Ver cambios en schema
```

---

## 🧪 Testing Rápido

### 1. Crear usuarios demo

Ejecutar `003_demo_data.sql` en Supabase SQL Editor (reemplazar UUIDs).

### 2. Login como prestador

- Email: `prestador.demo@agroconnect.ar`
- Pass: `demo123`

### 3. Probar flujo completo

1. Tab "Comprar Créditos" → comprar pack
2. Tab "Buscar Trabajos" → ver trabajos cercanos
3. Click "Ver Detalles" → datos bloqueados 🔒
4. Click "Tomar Trabajo" → confirmar
5. Tab "Mis Trabajos" → datos desbloqueados ✅

---

## 🐛 Troubleshooting Común

### Error: "Module not found: Can't resolve 'leaflet'"

```bash
npm install leaflet react-leaflet @types/leaflet
```

### Error: "Supabase client error"

Verificar `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### Error: "MercadoPago SDK error"

Verificar que `MP_ACCESS_TOKEN` empiece con `TEST-` o `APP-`.

### Estilos de Leaflet no se ven

Agregar en `app/layout.tsx`:
```typescript
import 'leaflet/dist/leaflet.css'
```

---

## 📦 Dependencias Principales

| Package | Versión | Uso |
|---------|---------|-----|
| next | ^14.2.0 | Framework |
| react | ^18.3.0 | UI |
| @supabase/supabase-js | ^2.43.0 | Database + Auth |
| mercadopago | ^2.0.11 | Pagos |
| leaflet | ^1.9.4 | Mapas (opcional) |
| tailwindcss | ^3.4.3 | Estilos |
| typescript | ^5.4.0 | Type safety |

---

## 🔐 Seguridad

### Variables de Entorno

**Públicas (frontend):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MP_PUBLIC_KEY`
- `NEXT_PUBLIC_APP_URL`

**Secretas (backend only):**
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️
- `MP_ACCESS_TOKEN` ⚠️

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:
- Usuarios solo ven sus propios datos
- Solicitudes abiertas visibles para prestadores
- Contacto solo visible después de tomar trabajo

---

## 🎨 Customización

### Cambiar colores

Editar `tailwind.config.ts`:
```typescript
colors: {
  primary: { ... },   // Verde actual
  secondary: { ... }, // Amarillo actual
}
```

### Cambiar textos

- Landing: `app/page.tsx`
- Emails: editar en strings

### Agregar provincia

Editar `lib/geo/argentina.ts`:
```typescript
{ nombre: 'NuevaProvincia', lat: -XX.XXXX, lng: -XX.XXXX }
```

---

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [MercadoPago Docs](https://www.mercadopago.com.ar/developers)
- [Tailwind Docs](https://tailwindcss.com/docs)

---

**¿Preguntas? Lee DEPLOYMENT.md y TESTING.md para más detalles. 🚀**
