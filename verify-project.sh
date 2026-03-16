#!/bin/bash

# Script para verificar que todos los archivos están presentes
# Ejecutar: chmod +x verify-project.sh && ./verify-project.sh

echo "🔍 Verificando proyecto AgroConnect Argentina..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1 - FALTA"
    return 1
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/"
    return 0
  else
    echo -e "${RED}✗${NC} $1/ - FALTA"
    return 1
  fi
}

missing=0

echo "📦 Configuración:"
check_file "package.json" || ((missing++))
check_file "tsconfig.json" || ((missing++))
check_file "next.config.mjs" || ((missing++))
check_file "tailwind.config.ts" || ((missing++))
check_file "postcss.config.mjs" || ((missing++))
check_file ".env.example" || ((missing++))
check_file ".gitignore" || ((missing++))
check_file "middleware.ts" || ((missing++))

echo ""
echo "📁 App:"
check_file "app/layout.tsx" || ((missing++))
check_file "app/page.tsx" || ((missing++))
check_file "app/globals.css" || ((missing++))

echo ""
echo "🔐 Auth:"
check_file "app/auth/login/page.tsx" || ((missing++))
check_file "app/auth/register/page.tsx" || ((missing++))

echo ""
echo "📊 Dashboards:"
check_file "app/dashboard/cliente/page.tsx" || ((missing++))
check_file "app/dashboard/prestador/page.tsx" || ((missing++))

echo ""
echo "💳 API MercadoPago:"
check_file "app/api/mp/preference/route.ts" || ((missing++))
check_file "app/api/mp/webhook/route.ts" || ((missing++))

echo ""
echo "📚 Librerías:"
check_file "lib/supabase/client.ts" || ((missing++))
check_file "lib/supabase/server.ts" || ((missing++))
check_file "lib/supabase/middleware.ts" || ((missing++))
check_file "lib/geo/argentina.ts" || ((missing++))

echo ""
echo "📝 Types:"
check_file "types/supabase.ts" || ((missing++))

echo ""
echo "🗄️ Migraciones:"
check_file "supabase/migrations/001_initial_schema.sql" || ((missing++))
check_file "supabase/migrations/002_seed_data.sql" || ((missing++))
check_file "supabase/migrations/003_demo_data.sql" || ((missing++))

echo ""
echo "📖 Documentación:"
check_file "README.md" || ((missing++))
check_file "DEPLOYMENT.md" || ((missing++))
check_file "TESTING.md" || ((missing++))
check_file "QUICKSTART.md" || ((missing++))
check_file "PROJECT_SUMMARY.md" || ((missing++))
check_file "START_HERE.md" || ((missing++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $missing -eq 0 ]; then
  echo -e "${GREEN}✅ Todos los archivos presentes! (32 archivos)${NC}"
  echo ""
  echo "🚀 Próximos pasos:"
  echo "  1. npm install"
  echo "  2. cp .env.example .env.local"
  echo "  3. Configurar Supabase + MercadoPago"
  echo "  4. npm run dev"
  echo ""
  echo "📚 Leer: START_HERE.md"
else
  echo -e "${RED}⚠️  Faltan $missing archivo(s)${NC}"
  echo ""
  echo "Revisar que hayas copiado todos los archivos correctamente."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
