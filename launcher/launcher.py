"""
AvilaPOS Launcher
Inicia Django + Vite en segundo plano sin ventanas de consola visibles.
Muestra ícono en la bandeja del sistema con opciones para abrir el navegador,
ver logs y cerrar el sistema.
"""
import sys
import os
import socket
import subprocess
import webbrowser
import logging
import time
import json
import signal
import threading
from pathlib import Path

# ─── Rutas del proyecto ──────────────────────────────────────────────────────

# Detecta si está corriendo como exe compilado con PyInstaller o como script
if getattr(sys, 'frozen', False):
    # Ejecutable compilado: BASE_DIR es donde vive AvilaPOS.exe (raíz del proyecto)
    BASE_DIR = Path(sys.executable).parent
else:
    # Script Python: sube un nivel desde launcher/
    BASE_DIR = Path(__file__).parent.parent

BACKEND_DIR   = BASE_DIR / 'backend'
FRONTEND_DIR  = BASE_DIR / 'frontend'
VENV_PYTHON   = BACKEND_DIR / 'venv' / 'Scripts' / 'python.exe'
LOG_DIR       = BASE_DIR / 'logs'
LOG_FILE      = LOG_DIR / 'avilapos.log'
PID_FILE      = BASE_DIR / 'launcher' / 'running.pids'

BACKEND_PORT  = 8000
FRONTEND_PORT = 5173
BACKEND_URL   = f'http://127.0.0.1:{BACKEND_PORT}/'
BROWSER_URL   = f'http://localhost:{FRONTEND_PORT}'

# Flag de Windows para ocultar la consola del proceso hijo
CREATE_NO_WINDOW = 0x08000000 if sys.platform == 'win32' else 0

# ─── Logging ─────────────────────────────────────────────────────────────────

LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    encoding='utf-8',
)

def log(msg, level='info'):
    getattr(logging, level)(msg)


# ─── Utilidades de red ───────────────────────────────────────────────────────

def is_port_in_use(port: int) -> bool:
    """Devuelve True si el puerto TCP está ocupado."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0


def wait_for_port(port: int, timeout: int = 40) -> bool:
    """Espera hasta que el puerto responda. Devuelve True si abrió a tiempo."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if is_port_in_use(port):
            return True
        time.sleep(1)
    return False


# ─── Gestión de procesos ─────────────────────────────────────────────────────

_procs: dict[str, subprocess.Popen] = {}


def _load_pids() -> dict:
    try:
        if PID_FILE.exists():
            return json.loads(PID_FILE.read_text())
    except Exception:
        pass
    return {}


def _save_pids():
    try:
        PID_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {k: p.pid for k, p in _procs.items() if p.poll() is None}
        PID_FILE.write_text(json.dumps(data))
    except Exception as e:
        log(f'No se pudo guardar PID file: {e}', 'warning')


def _kill_by_pid(pid: int):
    try:
        if sys.platform == 'win32':
            subprocess.run(['taskkill', '/F', '/T', '/PID', str(pid)],
                           creationflags=CREATE_NO_WINDOW,
                           capture_output=True)
        else:
            os.kill(pid, signal.SIGTERM)
    except Exception:
        pass


def start_django() -> subprocess.Popen:
    log('Iniciando servidor Django...')
    env = os.environ.copy()
    env['USE_SQLITE'] = 'True'
    env['PYTHONUNBUFFERED'] = '1'

    log_fd = open(LOG_FILE, 'ab')
    proc = subprocess.Popen(
        [str(VENV_PYTHON), 'manage.py', 'runserver', f'127.0.0.1:{BACKEND_PORT}', '--noreload'],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=log_fd,
        stderr=log_fd,
        creationflags=CREATE_NO_WINDOW,
    )
    _procs['django'] = proc
    log(f'Django PID={proc.pid}')
    return proc


def start_vite() -> subprocess.Popen:
    log('Iniciando servidor Vite (frontend)...')
    npm_cmd = 'npm.cmd' if sys.platform == 'win32' else 'npm'
    log_fd = open(LOG_FILE, 'ab')
    proc = subprocess.Popen(
        [npm_cmd, 'run', 'dev'],
        cwd=str(FRONTEND_DIR),
        stdout=log_fd,
        stderr=log_fd,
        creationflags=CREATE_NO_WINDOW,
    )
    _procs['vite'] = proc
    log(f'Vite PID={proc.pid}')
    return proc


def stop_all():
    log('Deteniendo todos los servicios...')
    # Matar por PID conocidos
    for name, proc in _procs.items():
        if proc.poll() is None:
            log(f'Terminando {name} (PID={proc.pid})')
            _kill_by_pid(proc.pid)

    # Fallback: matar por puerto
    for port in (BACKEND_PORT, FRONTEND_PORT):
        _kill_port(port)

    # Limpiar PID file
    try:
        if PID_FILE.exists():
            PID_FILE.unlink()
    except Exception:
        pass

    log('Sistema detenido.')


def _kill_port(port: int):
    """Mata el proceso que escucha en el puerto dado (Windows)."""
    if sys.platform != 'win32':
        return
    try:
        result = subprocess.run(
            ['netstat', '-ano'],
            capture_output=True, text=True, creationflags=CREATE_NO_WINDOW
        )
        for line in result.stdout.splitlines():
            if f':{port} ' in line and 'LISTENING' in line:
                parts = line.split()
                pid = int(parts[-1])
                if pid > 4:  # evitar matar System/Registry
                    _kill_by_pid(pid)
    except Exception:
        pass


# ─── Error dialog (tkinter, solo para errores críticos) ───────────────────────

def show_error(msg: str):
    try:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror('AvilaPOS – Error', msg)
        root.destroy()
    except Exception:
        pass  # si tkinter no está disponible, el error ya quedó en el log


# ─── Ícono de bandeja (pystray) ──────────────────────────────────────────────

def _make_icon_image():
    """Genera una imagen de ícono simple si no hay archivo .ico disponible."""
    try:
        from PIL import Image, ImageDraw
        img = Image.new('RGB', (64, 64), color='#1E3A8A')
        draw = ImageDraw.Draw(img)
        # Letra "A" blanca centrada
        draw.text((18, 15), 'A', fill='white')
        return img
    except Exception:
        return None


def _load_icon_image():
    """Carga icon.ico si existe, sino genera uno programático."""
    icon_path = BASE_DIR / 'launcher' / 'icon.ico'
    if not icon_path.exists():
        icon_path = Path(__file__).parent / 'icon.ico'
    try:
        from PIL import Image
        if icon_path.exists():
            return Image.open(str(icon_path))
    except Exception:
        pass
    return _make_icon_image()


def run_tray_icon():
    """Muestra el ícono en la bandeja del sistema. Bloquea hasta que el usuario cierra."""
    try:
        import pystray
        from pystray import MenuItem, Menu

        icon_img = _load_icon_image()
        if icon_img is None:
            log('No se pudo cargar imagen del ícono', 'warning')
            return

        def abrir_navegador(icon, item):
            webbrowser.open(BROWSER_URL)

        def ver_logs(icon, item):
            try:
                os.startfile(str(LOG_FILE))
            except Exception:
                pass

        def cerrar(icon, item):
            log('Usuario solicitó cierre desde bandeja.')
            icon.stop()
            stop_all()
            sys.exit(0)

        menu = Menu(
            MenuItem('Abrir Navegador', abrir_navegador, default=True),
            MenuItem('Ver Logs', ver_logs),
            Menu.SEPARATOR,
            MenuItem('Cerrar AvilaPOS', cerrar),
        )

        icon = pystray.Icon(
            'AvilaPOS',
            icon_img,
            'AvilaPOS – Corriendo',
            menu,
        )
        log('Ícono de bandeja iniciado.')
        icon.run()

    except ImportError:
        log('pystray no instalado. Usando fallback tkinter.', 'warning')
        _run_tkinter_fallback()


def _run_tkinter_fallback():
    """Ventana tkinter mínima como fallback si pystray no está disponible."""
    try:
        import tkinter as tk

        root = tk.Tk()
        root.title('AvilaPOS')
        root.resizable(False, False)
        root.geometry('300x120')
        root.attributes('-topmost', False)

        tk.Label(root, text='AvilaPOS está corriendo', font=('Segoe UI', 11, 'bold'), pady=10).pack()
        tk.Label(root, text='No cierres esta ventana mientras usás el sistema.', font=('Segoe UI', 9)).pack()

        def on_close():
            stop_all()
            root.destroy()
            sys.exit(0)

        tk.Button(root, text='Abrir Navegador', command=lambda: webbrowser.open(BROWSER_URL),
                  bg='#2563EB', fg='white', font=('Segoe UI', 9), padx=10).pack(pady=5)
        tk.Button(root, text='Cerrar AvilaPOS', command=on_close,
                  bg='#DC2626', fg='white', font=('Segoe UI', 9), padx=10).pack()

        root.protocol('WM_DELETE_WINDOW', on_close)
        root.mainloop()
    except Exception as e:
        log(f'Fallback tkinter falló: {e}', 'error')


# ─── Validaciones previas ────────────────────────────────────────────────────

def validate_environment() -> bool:
    """Verifica que el entorno mínimo esté disponible."""
    errors = []

    if not BACKEND_DIR.exists():
        errors.append(f'No se encontró la carpeta backend:\n{BACKEND_DIR}')

    if not VENV_PYTHON.exists():
        errors.append(
            f'No se encontró el entorno virtual Python:\n{VENV_PYTHON}\n\n'
            'Ejecutá scripts/instalar_todo.bat para configurar el sistema.'
        )

    if not FRONTEND_DIR.exists():
        errors.append(f'No se encontró la carpeta frontend:\n{FRONTEND_DIR}')

    if not (FRONTEND_DIR / 'node_modules').exists():
        errors.append(
            f'No se encontraron las dependencias Node.js.\n'
            'Ejecutá scripts/instalar_todo.bat para configurar el sistema.'
        )

    if errors:
        msg = '\n\n'.join(errors)
        log(f'Validación fallida:\n{msg}', 'error')
        show_error(msg)
        return False

    return True


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    log('=' * 60)
    log(f'AvilaPOS Launcher iniciando')
    log(f'BASE_DIR: {BASE_DIR}')
    log(f'Python: {sys.executable}')

    # Validar entorno
    if not validate_environment():
        sys.exit(1)

    # Si el backend ya está corriendo, solo abrir el browser
    if is_port_in_use(BACKEND_PORT):
        log(f'Puerto {BACKEND_PORT} ya en uso — sistema ya corriendo. Solo abro el navegador.')
        webbrowser.open(BROWSER_URL)
        run_tray_icon()
        return

    # Iniciar Django
    django_proc = start_django()
    log(f'Esperando que Django responda en puerto {BACKEND_PORT}...')
    if not wait_for_port(BACKEND_PORT, timeout=40):
        log('Django no respondió en 40 segundos.', 'error')
        _kill_by_pid(django_proc.pid)
        show_error(
            f'El servidor no pudo iniciarse en 40 segundos.\n'
            f'Revisá el archivo de log:\n{LOG_FILE}'
        )
        sys.exit(1)
    log(f'Django listo en puerto {BACKEND_PORT}.')

    # Iniciar Vite
    start_vite()
    log(f'Esperando que Vite responda en puerto {FRONTEND_PORT}...')
    if not wait_for_port(FRONTEND_PORT, timeout=30):
        log('Vite no respondió en 30 segundos.', 'error')
        show_error(
            f'El frontend no pudo iniciarse en 30 segundos.\n'
            f'Revisá el archivo de log:\n{LOG_FILE}'
        )
        stop_all()
        sys.exit(1)
    log(f'Vite listo en puerto {FRONTEND_PORT}.')

    # Guardar PIDs
    _save_pids()

    # Abrir navegador
    log(f'Abriendo navegador en {BROWSER_URL}')
    webbrowser.open(BROWSER_URL)

    # Mostrar ícono de bandeja (bloquea hasta cierre)
    run_tray_icon()


if __name__ == '__main__':
    main()
