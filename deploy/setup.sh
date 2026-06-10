#!/bin/bash
# Script de configuración inicial para Linux/Mac

echo "🚀 Configurando Casa de Repuestos - Sistema de Gestión"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Python
echo -e "${YELLOW}[1/8]${NC} Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Por favor instala Python 3.11 o superior."
    exit 1
fi
echo -e "${GREEN}✓${NC} Python $(python3 --version) encontrado"

# 2. Verificar Node.js
echo -e "${YELLOW}[2/8]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18 o superior."
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node --version) encontrado"

# 3. Verificar PostgreSQL
echo -e "${YELLOW}[3/8]${NC} Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL no encontrado. Puedes usar Docker: docker-compose up -d db"
else
    echo -e "${GREEN}✓${NC} PostgreSQL encontrado"
fi

# 4. Crear entorno virtual Python
echo -e "${YELLOW}[4/8]${NC} Creando entorno virtual..."
cd backend
python3 -m venv venv
echo -e "${GREEN}✓${NC} Entorno virtual creado"

# 5. Activar entorno e instalar dependencias
echo -e "${YELLOW}[5/8]${NC} Instalando dependencias de Python..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓${NC} Dependencias de Python instaladas"

# 6. Copiar .env.example a .env
echo -e "${YELLOW}[6/8]${NC} Configurando variables de entorno..."
cd ..
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Archivo .env creado"
else
    echo "⚠️  .env ya existe, no se sobrescribió"
fi

# 7. Instalar dependencias de Node
echo -e "${YELLOW}[7/8]${NC} Instalando dependencias de Node.js..."
cd frontend
npm install
echo -e "${GREEN}✓${NC} Dependencias de Node.js instaladas"

# 8. Instrucciones finales
echo ""
echo -e "${GREEN}✅ Configuración inicial completada!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Iniciar PostgreSQL (si usas Docker):"
echo "   docker-compose up -d db"
echo ""
echo "2. Aplicar migraciones:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python manage.py migrate"
echo ""
echo "3. Crear superusuario:"
echo "   python manage.py createsuperuser"
echo ""
echo "4. Iniciar backend (en una terminal):"
echo "   python manage.py runserver"
echo ""
echo "5. Iniciar frontend (en otra terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "6. Acceder a:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000/api"
echo "   Admin: http://localhost:8000/admin"
echo ""
