# 🚀 ¡Empezá Ahora!

Tu aplicación **AgroConnect Argentina** está 100% completa y lista para usar.

---

## ⚡ Opción 1: Desarrollo Local (Recomendado para empezar)

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar variables de entorno

1. Copiar el template:
```bash
cp .env.example .env.local
```

2. Crear proyecto en Supabase (https://app.supabase.com)
   - Click "New Project"
   - Elegir región: South America (Sao Paulo)
   - Guardar password

3. Ejecutar migraciones SQL:
   - Ir a SQL Editor en Supabase
   - Ejecutar en orden:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_seed_data.sql`
     - `supabase/migrations/003_demo_data.sql` (opcional)

4. Obtener credenciales Supabase:
   - Ir a Settings → API
   - Copiar URL y anon key

5. Crear app MercadoPago TEST:
   - Ir a https://www.mercadopago.com.ar/developers
   - Crear aplicación
   - Obtener credenciales TEST

6. Completar `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxxxx
MP_ACCESS_TOKEN=TEST-xxxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Paso 3: Iniciar servidor
```bash
npm run dev
```

### Paso 4: Abrir navegador
http://localhost:3000

¡Listo! Ya podés probar la aplicación. 🎉

---

## 🌐 Opción 2: Deploy Directo a Producción

### Paso 1: Push a GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/agroconnect-argentina.git
git push -u origin main
```

### Paso 2: Deploy en Vercel
1. Ir a https://vercel.com
2. Click "Add New Project"
3. Importar repo de GitHub
4. Configurar variables de entorno (las mismas de arriba)
5. Deploy

### Paso 3: Configurar webhooks
- En MercadoPago, actualizar URL webhook a:
  `https://tu-proyecto.vercel.app/api/mp/webhook`

¡Tu marketplace está online! 🚀

---

## 📚 ¿Qué leer primero?

Dependiendo de tu objetivo:

### Si querés PROBAR rápido:
👉 **QUICKSTART.md** - Setup en 5 minutos

### Si querés DEPLOYAR a producción:
👉 **DEPLOYMENT.md** - Guía completa paso a paso

### Si querés ENTENDER el proyecto:
👉 **README.md** - Overview técnico

### Si querés TESTEAR todo:
👉 **TESTING.md** - Casos de prueba completos

### Si querés un RESUMEN:
👉 **PROJECT_SUMMARY.md** - Todo lo que incluye

---

## 🎯 Flujo Recomendado para Principiantes

1. ✅ Instalar dependencias: `npm install`
2. ✅ Crear proyecto Supabase (gratis)
3. ✅ Ejecutar migraciones SQL
4. ✅ Configurar `.env.local`
5. ✅ Iniciar dev: `npm run dev`
6. ✅ Registrarte como "Prestador"
7. ✅ Ir a "Comprar Créditos"
8. ✅ Usar tarjeta TEST: 4509 9535 6623 3704
9. ✅ Ver que se acreditan créditos
10. ✅ Buscar trabajos y tomar uno

**Tiempo total: ~30 minutos** ⚡

---

## 🆘 ¿Problemas?

### Error al instalar dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de Supabase
- Verificar que las 3 migraciones SQL se ejecutaron sin errores
- Verificar que las variables en `.env.local` sean correctas

### Error de MercadoPago
- Asegurarse de usar credenciales TEST (empiezan con TEST-)
- Verificar que `MP_ACCESS_TOKEN` esté en `.env.local` (no `.env`)

### Más ayuda
- Ver **DEPLOYMENT.md** → Sección "Troubleshooting Común"
- Ver **QUICKSTART.md** → Sección "Troubleshooting Común"

---

## 📞 Recursos Útiles

- **Supabase Dashboard**: https://app.supabase.com
- **MercadoPago Dev**: https://www.mercadopago.com.ar/developers
- **Vercel**: https://vercel.com
- **Next.js Docs**: https://nextjs.org/docs

---

## 🎉 ¡Éxito!

Cuando veas la landing page en http://localhost:3000, ya estás listo para:

1. Crear usuarios de prueba
2. Publicar solicitudes
3. Comprar créditos
4. Tomar trabajos
5. Probar todo el flujo

**¡Disfrutá tu marketplace agropecuario! 🌾🇦🇷**

---

**Pro tip:** Ejecutá el script de datos demo (`003_demo_data.sql`) para tener usuarios y solicitudes precargados y probar más rápido.
