# 📘 Guía de Despliegue - AgroConnect Argentina

Esta guía te llevará paso a paso desde un proyecto local hasta una aplicación en producción con Vercel + Supabase + MercadoPago.

---

## 🎯 Prerequisitos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta GitHub (para alojar el código)
- ✅ Cuenta Vercel (https://vercel.com - gratis)
- ✅ Cuenta Supabase (https://supabase.com - gratis)
- ✅ Cuenta MercadoPago Argentina verificada
- ✅ Node.js 18+ instalado localmente

---

## 📋 Tabla de Contenidos

1. [Configurar Supabase](#1-configurar-supabase)
2. [Configurar MercadoPago](#2-configurar-mercadopago)
3. [Desplegar en Vercel](#3-desplegar-en-vercel)
4. [Testing y Verificación](#4-testing-y-verificación)
5. [Monitoreo y Mantenimiento](#5-monitoreo-y-mantenimiento)

---

## 1. Configurar Supabase

### 1.1 Crear Proyecto

1. Ir a https://app.supabase.com
2. Click en "New Project"
3. Completar:
   - **Name**: `agroconnect-argentina`
   - **Database Password**: Generar y guardar en lugar seguro
   - **Region**: South America (Sao Paulo) - más cercano a Argentina
   - **Pricing Plan**: Free (suficiente para MVP)

4. Esperar ~2 minutos mientras se crea el proyecto

### 1.2 Ejecutar Migraciones SQL

1. En el proyecto Supabase, ir a **SQL Editor** en el menú lateral
2. Click en "New Query"
3. Copiar el contenido de `supabase/migrations/001_initial_schema.sql`
4. Pegar y ejecutar (Run)
5. Repetir para `002_seed_data.sql`

**Verificar:** Ir a **Table Editor** y confirmar que existen estas tablas:
- `usuarios`
- `solicitudes`
- `transacciones`
- `packs_creditos`
- `configuracion_canon`

### 1.3 Configurar Authentication

1. Ir a **Authentication** → **Settings**
2. En **Site URL**, configurar: `https://tu-dominio.vercel.app`
3. En **Redirect URLs**, agregar:
   - `https://tu-dominio.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (para desarrollo)

### 1.4 Obtener Credenciales

1. Ir a **Settings** → **API**
2. Copiar y guardar:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca expongas esto al frontend)

---

## 2. Configurar MercadoPago

### 2.1 Crear Aplicación

1. Ir a https://www.mercadopago.com.ar/developers
2. Login con tu cuenta MercadoPago Argentina verificada
3. Ir a **Tus integraciones** → **Crear aplicación**
4. Completar:
   - **Nombre**: AgroConnect Argentina
   - **Modelo de negocio**: Marketplace
   - **Productos**: Checkout Pro

### 2.2 Obtener Credenciales de TEST

⚠️ **Importante:** Comienza con credenciales de TEST para probar

1. En tu aplicación, ir a **Credenciales de prueba**
2. Copiar:
   - **Public Key**: `NEXT_PUBLIC_MP_PUBLIC_KEY`
   - **Access Token**: `MP_ACCESS_TOKEN` (⚠️ secreto, backend only)

### 2.3 Configurar Webhook (TEST)

1. En tu aplicación MP, ir a **Webhooks**
2. Click en "Configurar webhooks"
3. Agregar URL: `https://tu-dominio.vercel.app/api/mp/webhook`
4. Eventos a suscribir:
   - ✅ `payment` (todos los estados de pago)

⚠️ **Nota:** Cambiarás esta URL cuando despliegues a producción

### 2.4 Credenciales de PRODUCCIÓN

**Solo cuando estés listo para lanzar:**

1. Ir a **Credenciales de producción**
2. Verificar que tu cuenta esté certificada
3. Obtener las credenciales reales
4. Actualizar variables de entorno en Vercel
5. Actualizar la URL del webhook

---

## 3. Desplegar en Vercel

### 3.1 Preparar Repositorio

1. **Subir código a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit - AgroConnect Argentina"
git remote add origin https://github.com/tu-usuario/agroconnect-argentina.git
git push -u origin main
```

### 3.2 Conectar con Vercel

1. Ir a https://vercel.com
2. Click en "Add New Project"
3. Importar tu repositorio de GitHub
4. Vercel detectará automáticamente que es Next.js

### 3.3 Configurar Variables de Entorno

En la sección **Environment Variables**, agregar:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# MercadoPago (TEST primero)
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx

# App
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app
```

⚠️ **Importante:**
- Las variables que empiezan con `NEXT_PUBLIC_` son públicas (frontend)
- Las que no tienen ese prefijo son secretas (backend only)

### 3.4 Deploy

1. Click en **Deploy**
2. Vercel construirá y desplegará tu aplicación (~3 minutos)
3. Una vez completado, te dará una URL: `https://tu-proyecto.vercel.app`

### 3.5 Actualizar URLs en Supabase y MercadoPago

**En Supabase:**
- Actualizar Site URL a `https://tu-proyecto.vercel.app`

**En MercadoPago:**
- Actualizar Webhook URL a `https://tu-proyecto.vercel.app/api/mp/webhook`

---

## 4. Testing y Verificación

### 4.1 Prueba Completa del Flujo

**Como Productor (Cliente):**
1. Registrarse → Tipo: Cliente
2. Completar datos con provincia argentina
3. Crear solicitud de servicio
4. Verificar que aparezca en estado "Abierta"

**Como Prestador:**
1. Registrarse → Tipo: Prestador
2. Seleccionar servicios que ofrece
3. Ir a "Comprar Créditos"
4. Intentar comprar un pack:
   - Será redirigido a MercadoPago (TEST)
   - Usar tarjeta de prueba: 4509 9535 6623 3704
   - Completar pago
5. Verificar que se acrediten los créditos
6. Buscar trabajos disponibles
7. Ver que datos de contacto estén bloqueados
8. Tomar un trabajo
9. Verificar que ahora puede ver datos de contacto

### 4.2 Tarjetas de Prueba MercadoPago

**Visa Aprobada:**
- Número: `4509 9535 6623 3704`
- CVV: `123`
- Fecha: Cualquier fecha futura
- Nombre: APRO

**Mastercard Rechazada:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Fecha: Cualquier fecha futura

Ver más: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/cards

### 4.3 Verificar Webhooks

1. Ir a https://tu-proyecto.vercel.app/api/mp/webhook
2. Deberías ver error 405 (Method Not Allowed) - esto es correcto
3. En MercadoPago Dashboard, ir a **Webhooks** → **Histórico**
4. Verificar que las notificaciones se estén recibiendo con status 200

---

## 5. Monitoreo y Mantenimiento

### 5.1 Logs en Vercel

- Ir a tu proyecto en Vercel
- Click en **Deployments**
- Click en cualquier deployment
- Ver **Runtime Logs** para debugging

### 5.2 Logs en Supabase

- **Database**: Ver queries lentas
- **Auth**: Ver intentos de login
- **API**: Ver tráfico de API

### 5.3 Configuración de Producción MercadoPago

**Cuando estés listo para GO LIVE:**

1. **Completar certificación de MercadoPago:**
   - Verificar integración
   - Pasar review de seguridad

2. **Actualizar credenciales en Vercel:**
   ```bash
   NEXT_PUBLIC_MP_PUBLIC_KEY=APP-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   MP_ACCESS_TOKEN=APP-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
   ```

3. **Actualizar webhook URL** en MercadoPago Dashboard

4. **Re-deploy** en Vercel para aplicar cambios

---

## 🔧 Troubleshooting Común

### Error: "No autenticado"
- Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén configuradas en Vercel
- Re-deploy después de cambiar variables

### Error: "MercadoPago preference failed"
- Verificar que `MP_ACCESS_TOKEN` sea correcto (empieza con TEST- o APP-)
- Ver logs en Vercel Runtime Logs

### Webhook no recibe notificaciones
- Verificar URL en MercadoPago Dashboard
- Verificar que la URL sea pública (no localhost)
- Ver histórico de webhooks en MP Dashboard

### RLS Policy Error en Supabase
- Verificar que las policies estén habilitadas
- Ir a **Table Editor** → Click en tabla → **RLS Policies**
- Re-ejecutar migraciones si es necesario

---

## 📊 Métricas Recomendadas

**Configurar en Vercel Analytics:**
- Page views
- Registrations (clientes vs prestadores)
- Transactions completed
- Average payment time

**Configurar en Supabase:**
- Database size
- Active users
- API requests per day

---

## 🚀 Checklist de Lanzamiento

Antes de lanzar públicamente:

- [ ] Ejecutar todas las migraciones en Supabase producción
- [ ] Cambiar credenciales MP de TEST a PRODUCCIÓN
- [ ] Configurar dominio personalizado en Vercel (opcional)
- [ ] Configurar SSL/HTTPS (automático en Vercel)
- [ ] Actualizar Site URL en Supabase
- [ ] Actualizar Webhook URL en MercadoPago
- [ ] Probar flujo completo end-to-end con tarjeta real
- [ ] Configurar monitoreo y alertas
- [ ] Preparar plan de backup de base de datos
- [ ] Documentar proceso de soporte para usuarios

---

## 📧 Soporte

- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **MercadoPago**: https://www.mercadopago.com.ar/developers/es/support

---

**¡Listo! Tu marketplace agropecuario está en producción 🌾🇦🇷**
