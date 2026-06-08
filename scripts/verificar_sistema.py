"""
AvilaPOS - Verificación y reparación automática del sistema
Diagnostica cada componente y lo instala/configura si falta.
"""
import sys
import os

# Forzar UTF-8 en stdout para evitar errores de encoding en Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
import socket
import subprocess
import shutil
import platform
import time
from pathlib import Path

# ─── Colores ANSI ────────────────────────────────────────────────────────────
try:
    import ctypes
    ctypes.windll.kernel32.SetConsoleMode(
        ctypes.windll.kernel32.GetStdHandle(-11), 7)
    G = '\033[92m'; Y = '\033[93m'; R = '\033[91m'
    B = '\033[94m'; RESET = '\033[0m'; BOLD = '\033[1m'
except Exception:
    G = Y = R = B = RESET = BOLD = ''

ROOT     = Path(__file__).parent.parent
BACKEND  = ROOT / 'backend'
FRONTEND = ROOT / 'frontend'
VENV_PY  = BACKEND / 'venv' / 'Scripts' / 'python.exe'
VENV_PIP = BACKEND / 'venv' / 'Scripts' / 'pip.exe'

n_ok = n_warn = n_fail = n_fixed = 0


def linea(caracter='-', ancho=64):
    print(caracter * ancho)


def titulo(texto):
    print(f'\n{BOLD}[{texto}]{RESET}')


def ok(msg, detail=''):
    global n_ok; n_ok += 1
    print(f'  {G}OK  {RESET} {msg}')
    if detail: print(f'       {detail}')


def warn(msg, detail=''):
    global n_warn; n_warn += 1
    print(f'  {Y}WARN{RESET} {msg}')
    if detail: print(f'       {detail}')


def fail(msg, detail=''):
    global n_fail; n_fail += 1
    print(f'  {R}FAIL{RESET} {msg}')
    if detail: print(f'       {detail}')


def fixed(msg):
    global n_fixed; n_fixed += 1
    print(f'  {B}FIX {RESET} {msg}')


def skip(msg):
    print(f'  {Y}SKIP{RESET} {msg}')


def run(cmd, cwd=None, env=None, capture=True):
    """Ejecuta un comando y devuelve (ok, stdout+stderr)."""
    try:
        r = subprocess.run(
            cmd, cwd=cwd, env=env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding='utf-8', errors='replace'
        )
        return r.returncode == 0, r.stdout
    except Exception as e:
        return False, str(e)


def run_visible(cmd, cwd=None, env=None):
    """Ejecuta mostrando la salida en tiempo real."""
    try:
        r = subprocess.run(cmd, cwd=cwd, env=env)
        return r.returncode == 0
    except Exception:
        return False


def find_python():
    for candidate in ('py', 'python', 'python3'):
        if shutil.which(candidate):
            ok2, v = run([candidate, '--version'])
            if ok2 and 'Python 3' in v:
                return candidate
    return None


# ════════════════════════════════════════════════════════════════════
print()
linea('=')
print(f'{BOLD}  AVILAPOS - VERIFICACION Y CONFIGURACION AUTOMATICA{RESET}')
linea('=')
print(f'  Carpeta: {ROOT}')
linea('-')

# ─── 1. Permisos de escritura ────────────────────────────────────────────────
titulo('Permisos de escritura')
test = ROOT / '_test_.tmp'
try:
    test.write_text('x'); test.unlink()
    ok(f'Escritura permitida en {ROOT}')
except Exception:
    fail(f'Sin permisos de escritura en {ROOT}',
         'Mover la carpeta del proyecto a C:\\AvilaPOS\\ o similar')

# ─── 2. Espacio en disco ────────────────────────────────────────────────────
titulo('Espacio en disco')
try:
    gb = shutil.disk_usage(ROOT).free / 1_073_741_824
    if gb >= 2:
        ok(f'Espacio libre: {gb:.1f} GB')
    elif gb >= 0.5:
        warn(f'Espacio libre: {gb:.1f} GB — recomendado 2 GB')
    else:
        fail(f'Espacio insuficiente: {gb:.1f} GB — se necesitan 2 GB')
except Exception as e:
    warn(f'No se pudo medir: {e}')

# ─── 3. Python ──────────────────────────────────────────────────────────────
titulo('Python')
py_cmd = find_python()
if not py_cmd:
    print(f'  {R}FAIL{RESET} Python no encontrado en el PATH.')
    print(f'       Intentando instalar con winget...')
    exito = run_visible([
        'winget', 'install', 'Python.Python.3.11',
        '--accept-package-agreements', '--accept-source-agreements', '--silent'
    ])
    if exito:
        fixed('Python instalado con winget.')
        print(f'\n  {Y}IMPORTANTE:{RESET} Cerrá esta ventana, abrí una nueva')
        print('  y volvé a ejecutar verificar_sistema.bat')
        print('\n' + '─' * 64)
        input('  Presioná Enter para salir...')
        sys.exit(0)
    else:
        fail('No se pudo instalar Python automáticamente.',
             'Instalarlo manualmente: https://www.python.org/downloads/\n'
             '       Marcar "Add Python to PATH" al instalar.')
        linea('─')
        input('  Presioná Enter para salir...')
        sys.exit(1)
else:
    _, v = run([py_cmd, '--version'])
    ver = v.strip().split()[-1]
    parts = ver.split('.')
    major, minor = int(parts[0]), int(parts[1])
    if minor > 12:
        warn(f'Python {ver} — muy nuevo. Recomendado 3.11 o 3.12')
    elif minor < 9:
        warn(f'Python {ver} — antiguo. Recomendado 3.11 o 3.12')
    else:
        ok(f'Python {ver} ({py_cmd})')

# ─── 4. Node.js ─────────────────────────────────────────────────────────────
titulo('Node.js')
if not shutil.which('node'):
    print(f'  {R}FAIL{RESET} Node.js no encontrado. Intentando instalar...')
    exito = run_visible([
        'winget', 'install', 'OpenJS.NodeJS.LTS',
        '--accept-package-agreements', '--accept-source-agreements', '--silent'
    ])
    if exito:
        fixed('Node.js instalado con winget.')
        print(f'\n  {Y}IMPORTANTE:{RESET} Cerrá esta ventana, abrí una nueva')
        print('  y volvé a ejecutar verificar_sistema.bat')
        input('  Presioná Enter para salir...')
        sys.exit(0)
    else:
        fail('No se pudo instalar Node.js automáticamente.',
             'Instalarlo manualmente: https://nodejs.org/ (versión LTS)')
else:
    _, v = run(['node', '--version'])
    ver = v.strip().lstrip('v')
    major = int(ver.split('.')[0])
    if major < 18:
        warn(f'Node.js v{ver} — recomendado v18 o superior')
    else:
        ok(f'Node.js v{ver}')

# ─── 5. Entorno virtual Python ──────────────────────────────────────────────
titulo('Entorno virtual Python (venv)')
if not VENV_PY.exists():
    print(f'  {Y}WARN{RESET} venv no existe — creando...')
    exito, out = run([py_cmd, '-m', 'venv', str(BACKEND / 'venv')])
    if exito and VENV_PY.exists():
        fixed('Entorno virtual creado.')
    else:
        fail('No se pudo crear el entorno virtual.', out.strip())
else:
    _, v = run([str(VENV_PY), '--version'])
    ok(f'venv con {v.strip()}')

# ─── 6. Dependencias Python ─────────────────────────────────────────────────
titulo('Dependencias Python (Django, DRF, JWT, etc.)')
if VENV_PY.exists():
    chk, _ = run([str(VENV_PY), '-c',
                  'import django, rest_framework, corsheaders, reportlab, PIL'])
    if not chk:
        print(f'  {Y}WARN{RESET} Dependencias no instaladas — instalando...')
        print('       (esto puede tardar varios minutos)')
        # Actualizar pip primero
        run([str(VENV_PY), '-m', 'pip', 'install', '--upgrade', 'pip', '--quiet'])
        exito = run_visible(
            [str(VENV_PIP), 'install', '-r', str(BACKEND / 'requirements.txt')],
            cwd=str(BACKEND)
        )
        if exito:
            fixed('Dependencias Python instaladas.')
        else:
            fail('Error al instalar dependencias Python.',
                 'Verificar conexión a internet y volver a intentar.')
    else:
        _, v = run([str(VENV_PY), '-c',
                    'import django; print(django.get_version())'])
        ok(f'Django {v.strip()} + dependencias OK')
else:
    skip('(venv no existe)')

# ─── 7. pystray (launcher sin consola) ──────────────────────────────────────
titulo('pystray (ícono en bandeja del sistema)')
if VENV_PY.exists():
    chk, _ = run([str(VENV_PY), '-c', 'import pystray, PIL'])
    if not chk:
        print(f'  {Y}WARN{RESET} pystray no instalado — instalando...')
        exito, out = run(
            [str(VENV_PIP), 'install', 'pystray==0.19.5', 'pillow==11.1.0', '--quiet']
        )
        if exito:
            fixed('pystray instalado.')
        else:
            fail('No se pudo instalar pystray.', out.strip())
    else:
        ok('pystray instalado')
else:
    skip('(venv no existe)')

# ─── 8. Dependencias frontend ───────────────────────────────────────────────
titulo('Dependencias frontend (node_modules)')
npm_cmd = 'npm.cmd' if platform.system() == 'Windows' else 'npm'
vite_ok = (FRONTEND / 'node_modules' / '.bin' / 'vite').exists() or \
          (FRONTEND / 'node_modules' / '.bin' / 'vite.cmd').exists()
if not vite_ok:
    print(f'  {Y}WARN{RESET} node_modules no instalado — ejecutando npm install...')
    print('       (esto puede tardar varios minutos)')
    exito = run_visible([npm_cmd, 'run', '--if-present', 'noop'],
                        cwd=str(FRONTEND))  # test npm
    exito = run_visible([npm_cmd, 'install'], cwd=str(FRONTEND))
    if exito:
        fixed('Dependencias frontend instaladas.')
    else:
        fail('Error en npm install.', 'Verificar conexión a internet.')
else:
    ok('node_modules instalado (vite encontrado)')

# ─── 9. Base de datos ───────────────────────────────────────────────────────
titulo('Base de datos (SQLite)')
db = BACKEND / 'db.sqlite3'
if not db.exists():
    print(f'  {Y}WARN{RESET} db.sqlite3 no existe — aplicando migraciones...')
    env = os.environ.copy()
    env['USE_SQLITE'] = 'True'
    exito = run_visible(
        [str(VENV_PY), 'manage.py', 'migrate', '--noinput'],
        cwd=str(BACKEND), env=env
    )
    if exito and db.exists():
        fixed('Base de datos creada y migrada.')
    else:
        fail('No se pudieron aplicar las migraciones.',
             'Verificar que Django esté instalado correctamente.')
else:
    # Verificar que las migraciones estén al día
    env = os.environ.copy()
    env['USE_SQLITE'] = 'True'
    chk, out = run(
        [str(VENV_PY), 'manage.py', 'migrate', '--check', '--noinput'],
        cwd=str(BACKEND), env=env
    )
    if not chk:
        print(f'  {Y}WARN{RESET} Hay migraciones pendientes — aplicando...')
        exito = run_visible(
            [str(VENV_PY), 'manage.py', 'migrate', '--noinput'],
            cwd=str(BACKEND), env=env
        )
        if exito:
            fixed('Migraciones aplicadas.')
        else:
            fail('Error al aplicar migraciones.')
    else:
        kb = db.stat().st_size // 1024
        ok(f'db.sqlite3 lista y al día ({kb} KB)')

# ─── 10. Usuario administrador ──────────────────────────────────────────────
titulo('Usuario administrador')
if VENV_PY.exists() and db.exists():
    env = os.environ.copy()
    env['USE_SQLITE'] = 'True'
    admin_script = BACKEND / 'verificar_admin.py'
    if admin_script.exists():
        exito, out = run([str(VENV_PY), str(admin_script)],
                         cwd=str(BACKEND), env=env)
        if 'OK' in out or 'exitosa' in out.lower():
            ok("Usuario 'admin' listo (contraseña: admin123)")
        else:
            warn("No se pudo verificar el usuario admin.", out.strip())
    else:
        # Crear admin directamente
        script = (
            "import os, sys\n"
            "sys.path.insert(0, r'{}')\n"
            "os.environ['USE_SQLITE']='True'\n"
            "os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')\n"
            "import django; django.setup()\n"
            "from django.contrib.auth import get_user_model\n"
            "U=get_user_model()\n"
            "if not U.objects.filter(username='admin').exists():\n"
            "    u=U.objects.create_superuser('admin','admin@local.com','admin123')\n"
            "    u.is_superuser=True; u.is_staff=True; u.save()\n"
            "    print('OK creado')\n"
            "else:\n"
            "    print('OK existe')\n"
        ).format(BACKEND)
        exito, out = run([str(VENV_PY), '-c', script],
                         cwd=str(BACKEND), env=env)
        if 'OK creado' in out:
            fixed("Usuario 'admin' creado (contraseña: admin123)")
        elif 'OK existe' in out:
            ok("Usuario 'admin' existe")
        else:
            warn("No se pudo verificar el usuario admin.")
else:
    skip('(venv o base de datos no disponibles)')

# ─── 11. Carpeta de logs ────────────────────────────────────────────────────
titulo('Carpeta de logs')
logs_dir = ROOT / 'logs'
if not logs_dir.exists():
    logs_dir.mkdir(parents=True, exist_ok=True)
    fixed('Carpeta logs/ creada.')
else:
    ok('Carpeta logs/ existe')

# ─── 12. AvilaPOS.exe ───────────────────────────────────────────────────────
titulo('AvilaPOS.exe (launcher)')
exe = ROOT / 'AvilaPOS.exe'
if exe.exists():
    mb = exe.stat().st_size / 1_048_576
    ok(f'AvilaPOS.exe encontrado ({mb:.1f} MB)')
else:
    warn('AvilaPOS.exe no encontrado.',
         'Asegurate de copiar AvilaPOS.exe a la carpeta raíz del proyecto.')

# ─── 13. Puertos ────────────────────────────────────────────────────────────
titulo('Puertos 8000 y 5173')
for port, nombre in ((8000, 'Django/backend'), (5173, 'Vite/frontend')):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        en_uso = s.connect_ex(('127.0.0.1', port)) == 0
    if en_uso:
        warn(f'Puerto {port} ({nombre}) en uso — el sistema ya puede estar corriendo')
    else:
        ok(f'Puerto {port} ({nombre}) libre')

# ─── 14. Conexión a internet ────────────────────────────────────────────────
titulo('Conexión a internet')
try:
    socket.create_connection(('8.8.8.8', 53), timeout=3).close()
    ok('Conexión disponible')
except OSError:
    warn('Sin conexión a internet',
         'Necesaria para descargar dependencias si no están instaladas')

# ════════════════════════════════════════════════════════════════════
# RESULTADO
# ════════════════════════════════════════════════════════════════════
print()
linea('=')
print(f'{BOLD}  RESULTADO{RESET}')
linea('-')
print(f'  {G}OK  {RESET}  {n_ok}  verificaciones correctas')
print(f'  {B}FIX {RESET}  {n_fixed}  problemas resueltos automáticamente')
print(f'  {Y}WARN{RESET}  {n_warn}  advertencias')
print(f'  {R}FAIL{RESET}  {n_fail}  errores críticos (requieren acción manual)')
print()

if n_fail > 0:
    print(f'  {R}ESTADO: REQUIERE ACCIÓN MANUAL{RESET}')
    print(f'  Hay {n_fail} error(es) que no pudieron resolverse automáticamente.')
    print('  Seguí las instrucciones indicadas en los FAIL de arriba.')
elif n_warn > 0:
    print(f'  {Y}ESTADO: LISTO (con advertencias menores){RESET}')
    print('  El sistema debería funcionar. Revisá los WARN si hay problemas.')
else:
    print(f'  {G}ESTADO: TODO OK — SISTEMA LISTO{RESET}')
    if n_fixed > 0:
        print(f'  Se resolvieron {n_fixed} item(s) automáticamente.')
    print('  Ejecutar: AvilaPOS.exe')

linea('=')
print()
