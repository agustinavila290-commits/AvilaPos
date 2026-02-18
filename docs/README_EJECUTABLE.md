# 🚀 Cómo Usar el Ejecutable

## Métodos de Inicio

### 1️⃣ Script BAT (Recomendado - Más Simple)

**Archivo:** `iniciar_sistema.bat`

**Uso:**
1. Hacer doble clic en `iniciar_sistema.bat`
2. El sistema se iniciará automáticamente
3. Se abrirán 2 ventanas (Backend y Frontend)
4. El navegador se abrirá en http://localhost:5173

**Detener:**
- Presionar cualquier tecla en la ventana principal
- O cerrar las ventanas de Backend y Frontend

---

### 2️⃣ Script PowerShell (Más Bonito)

**Archivo:** `iniciar_sistema.ps1`

**Uso:**
1. Clic derecho en `iniciar_sistema.ps1`
2. Seleccionar "Ejecutar con PowerShell"
3. (O desde PowerShell: `.\iniciar_sistema.ps1`)

**Nota:** Si PowerShell bloquea la ejecución:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### 3️⃣ Crear Acceso Directo en el Escritorio

**Para el .bat:**
1. Clic derecho en `iniciar_sistema.bat`
2. Enviar a > Escritorio (crear acceso directo)
3. Clic derecho en el acceso directo > Propiedades
4. Cambiar el icono (opcional)
5. Ejecutar como administrador: NO es necesario

**Para el .ps1:**
1. Clic derecho en escritorio > Nuevo > Acceso directo
2. Ubicación:
   ```
   powershell.exe -ExecutionPolicy Bypass -File "C:\Users\Agustin\Avila\iniciar_sistema.ps1"
   ```
3. Nombre: "Casa de Repuestos"
4. Terminar

---

### 4️⃣ Crear Ejecutable Real (.exe) - OPCIONAL

Para crear un .exe verdadero, puedes usar:

#### Opción A: PS1 a EXE con PS2EXE
```powershell
# Instalar ps2exe
Install-Module -Name ps2exe -Scope CurrentUser

# Crear ejecutable
ps2exe -inputFile "iniciar_sistema.ps1" -outputFile "CasaDeRepuestos.exe" -title "Casa de Repuestos" -version "1.0.0" -company "Casa de Repuestos" -noConsole
```

#### Opción B: BAT a EXE con Bat To Exe Converter
1. Descargar: https://www.f2ko.de/en/b2e.php
2. Abrir Bat To Exe Converter
3. Seleccionar `iniciar_sistema.bat`
4. Configurar opciones:
   - Nombre: CasaDeRepuestos.exe
   - Icono: (opcional)
   - Incluir archivos: NO
5. Compilar

---

## ⚙️ Requisitos Previos

Antes de usar el ejecutable, asegúrate de tener instalado:

✅ **Python 3.13+**
✅ **Node.js 18+**
✅ **Dependencias instaladas** (ejecutar una vez):

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
python manage.py migrate

# Frontend
cd ../frontend
npm install
```

---

## 🎯 Acceso al Sistema

Una vez iniciado:

- **Aplicación Web:** http://localhost:5173
- **API Backend:** http://localhost:8000
- **Panel Admin:** http://localhost:8000/admin

### Credenciales

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Cajero:**
- Usuario: `cajero`
- Contraseña: `cajero123`

---

## 🛠️ Solución de Problemas

### "Python no está instalado"
- Instalar Python desde: https://www.python.org/downloads/
- Marcar "Add to PATH" durante instalación

### "Node.js no está instalado"
- Instalar Node.js desde: https://nodejs.org/
- Reiniciar terminal después de instalar

### "No se encuentra manage.py"
- Asegurarse de ejecutar desde la carpeta raíz del proyecto
- Ruta correcta: `C:\Users\Agustin\Avila\`

### El navegador no se abre
- Esperar 10-15 segundos después de iniciar
- Abrir manualmente: http://localhost:5173

### Puerto ya en uso
- Cerrar otras instancias del sistema
- O cambiar puertos en configuración

---

## 📦 Distribución

### Para compartir el sistema:

1. **Comprimir carpeta completa:**
   - Incluir: backend, frontend, scripts de inicio
   - Excluir: `node_modules`, `venv`, `__pycache__`, `.git`

2. **Instrucciones para el usuario final:**
   ```
   1. Extraer carpeta
   2. Instalar Python 3.13+ (si no lo tiene)
   3. Instalar Node.js 18+ (si no lo tiene)
   4. Ejecutar "iniciar_sistema.bat"
   5. Esperar 10-15 segundos
   6. El sistema se abrirá en el navegador
   ```

---

## 🎨 Personalización

### Cambiar nombre del ejecutable:
- Renombrar `iniciar_sistema.bat` a `CasaDeRepuestos.bat`

### Cambiar icono:
1. Descargar icono (.ico)
2. Crear acceso directo
3. Propiedades > Cambiar icono

### Iniciar minimizado:
En el .bat, cambiar:
```batch
start "Backend Django" /MIN cmd /k "..."
```

---

## ✅ Ventajas de Usar el Ejecutable

✅ Un solo clic para iniciar todo
✅ No necesitas recordar comandos
✅ Detección automática de errores
✅ Abre el navegador automáticamente
✅ Fácil de compartir con otros usuarios
✅ Detiene correctamente todos los procesos

---

**Versión:** 1.0.0  
**Fecha:** 11 de febrero de 2026
