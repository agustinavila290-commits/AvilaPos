@echo off
REM Script para generar clave privada y CSR para AFIP/ARCA
REM Requiere OpenSSL instalado

echo ========================================
echo  GENERAR CERTIFICADO AFIP/ARCA
echo ========================================
echo.

REM Buscar OpenSSL en ubicaciones comunes
set OPENSSL_PATH=
where openssl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set OPENSSL_CMD=openssl
    goto :found_openssl
)

REM Buscar en ubicaciones comunes de Windows
if exist "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" (
    set OPENSSL_CMD="C:\Program Files\OpenSSL-Win64\bin\openssl.exe"
    set OPENSSL_CNF="C:\Program Files\OpenSSL-Win64\bin\cnf\openssl.cnf"
    goto :found_openssl
)

if exist "C:\Program Files (x86)\OpenSSL-Win32\bin\openssl.exe" (
    set OPENSSL_CMD="C:\Program Files (x86)\OpenSSL-Win32\bin\openssl.exe"
    if exist "C:\Program Files (x86)\OpenSSL-Win32\bin\cnf\openssl.cnf" (
        set OPENSSL_CNF="C:\Program Files (x86)\OpenSSL-Win32\bin\cnf\openssl.cnf"
    )
    goto :found_openssl
)

if exist "C:\OpenSSL-Win64\bin\openssl.exe" (
    set OPENSSL_CMD="C:\OpenSSL-Win64\bin\openssl.exe"
    if exist "C:\OpenSSL-Win64\bin\cnf\openssl.cnf" (
        set OPENSSL_CNF="C:\OpenSSL-Win64\bin\cnf\openssl.cnf"
    )
    goto :found_openssl
)

if exist "C:\OpenSSL-Win32\bin\openssl.exe" (
    set OPENSSL_CMD="C:\OpenSSL-Win32\bin\openssl.exe"
    if exist "C:\OpenSSL-Win32\bin\cnf\openssl.cnf" (
        set OPENSSL_CNF="C:\OpenSSL-Win32\bin\cnf\openssl.cnf"
    )
    goto :found_openssl
)

REM No encontrado
echo [ERROR] OpenSSL no encontrado
echo.
echo Buscado en:
echo   - PATH del sistema
echo   - C:\Program Files\OpenSSL-Win64\bin\
echo   - C:\Program Files (x86)\OpenSSL-Win32\bin\
echo   - C:\OpenSSL-Win64\bin\
echo   - C:\OpenSSL-Win32\bin\
echo.
echo Si OpenSSL esta instalado en otra ubicacion, edita este script
echo y agrega la ruta completa a openssl.exe
echo.
pause
exit /b 1

:found_openssl
echo [OK] OpenSSL encontrado: %OPENSSL_CMD%
if defined OPENSSL_CNF (
    echo [OK] Configuracion encontrada: %OPENSSL_CNF%
)
echo.

REM Crear carpeta certs si no existe
if not exist "certs" mkdir certs

echo Generando clave privada...
%OPENSSL_CMD% genrsa -out certs\clave_privada.key 2048

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo generar la clave privada
    pause
    exit /b 1
)

echo [OK] Clave privada generada: certs\clave_privada.key
echo.

echo Generando CSR (Certificate Signing Request)...
echo.
echo IMPORTANTE: Completar los siguientes datos:
echo   - Country Name: AR (Argentina)
echo   - State/Province: Tu provincia
echo   - Locality: Tu ciudad
echo   - Organization: Tu razon social
echo   - Common Name: facturacion_wsfe (o el nombre que prefieras)
echo   - Email: (opcional)
echo   - Challenge password: (dejar vacio)
echo   - Optional company name: (dejar vacio)
echo.

REM Generar CSR con configuracion si esta disponible
if defined OPENSSL_CNF (
    %OPENSSL_CMD% req -new -key certs\clave_privada.key -out certs\solicitud.csr -config %OPENSSL_CNF%
) else (
    %OPENSSL_CMD% req -new -key certs\clave_privada.key -out certs\solicitud.csr
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo generar la CSR
    pause
    exit /b 1
)

echo.
echo ========================================
echo  PROCESO COMPLETADO
echo ========================================
echo.
echo Archivos generados:
echo   [OK] certs\clave_privada.key
echo   [OK] certs\solicitud.csr
echo.
echo PROXIMOS PASOS:
echo   1. Subir solicitud.csr a ARCA/AFIP
echo   2. Descargar certificado.crt de ARCA
echo   3. Configurar en el sistema
echo.
echo IMPORTANTE:
echo   - Guardar clave_privada.key en lugar seguro
echo   - NO compartir la clave privada
echo   - Si perdes la clave privada, NO se puede recuperar
echo.
pause
