#!/bin/bash
# Script para generar clave privada y CSR para AFIP/ARCA
# Requiere OpenSSL instalado

echo "========================================"
echo "  GENERAR CERTIFICADO AFIP/ARCA"
echo "========================================"
echo ""

# Verificar si OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
    echo "[ERROR] OpenSSL no encontrado"
    echo ""
    echo "Instalar OpenSSL:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  macOS: brew install openssl"
    echo "  Windows: https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
fi

echo "[OK] OpenSSL encontrado"
echo ""

# Crear carpeta certs si no existe
mkdir -p certs

echo "Generando clave privada..."
openssl genrsa -out certs/clave_privada.key 2048

if [ $? -ne 0 ]; then
    echo "[ERROR] No se pudo generar la clave privada"
    exit 1
fi

echo "[OK] Clave privada generada: certs/clave_privada.key"
echo ""

echo "Generando CSR (Certificate Signing Request)..."
echo ""
echo "IMPORTANTE: Completar los siguientes datos:"
echo "  - Country Name: AR (Argentina)"
echo "  - State/Province: Tu provincia"
echo "  - Locality: Tu ciudad"
echo "  - Organization: Tu razon social"
echo "  - Common Name: facturacion_wsfe (o el nombre que prefieras)"
echo "  - Email: (opcional)"
echo "  - Challenge password: (dejar vacio)"
echo "  - Optional company name: (dejar vacio)"
echo ""

openssl req -new -key certs/clave_privada.key -out certs/solicitud.csr

if [ $? -ne 0 ]; then
    echo "[ERROR] No se pudo generar la CSR"
    exit 1
fi

echo ""
echo "========================================"
echo "  PROCESO COMPLETADO"
echo "========================================"
echo ""
echo "Archivos generados:"
echo "  [OK] certs/clave_privada.key"
echo "  [OK] certs/solicitud.csr"
echo ""
echo "PROXIMOS PASOS:"
echo "  1. Subir solicitud.csr a ARCA/AFIP"
echo "  2. Descargar certificado.crt de ARCA"
echo "  3. Configurar en el sistema"
echo ""
echo "IMPORTANTE:"
echo "  - Guardar clave_privada.key en lugar seguro"
echo "  - NO compartir la clave privada"
echo "  - Si perdes la clave privada, NO se puede recuperar"
echo ""
