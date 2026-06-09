"""
Management command para configurar la facturación AFIP/ARCA.

Uso:
    python manage.py setup_afip                 # crea config + punto de venta 1
    python manage.py setup_afip --produccion    # ambiente Producción en lugar de Homologación
    python manage.py setup_afip --pv 2          # punto de venta 2
    python manage.py setup_afip --info          # muestra el estado actual sin modificar nada
"""
import os
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError


BASE_DIR = Path(__file__).resolve().parents[4]  # backend/
CERT_DIR = BASE_DIR / 'scripts' / 'certs'
CERT_FILE = CERT_DIR / 'facturacion_2102a5b8dee42c69.crt'
KEY_FILE = CERT_DIR / 'clave_privada.key'

CUIT_DEFAULT = '20238543917'
RAZON_SOCIAL_DEFAULT = 'Avila Moto Repuesto'
DOMICILIO_DEFAULT = ''
INICIO_ACTIVIDADES_DEFAULT = '2020-01-01'


class Command(BaseCommand):
    help = 'Configura ConfiguracionAFIP y PuntoVenta para activar la facturación electrónica'

    def add_arguments(self, parser):
        parser.add_argument('--produccion', action='store_true', default=False,
                            help='Usar ambiente Producción (por defecto: Homologación)')
        parser.add_argument('--pv', type=int, default=1,
                            help='Número de Punto de Venta a crear (por defecto: 1)')
        parser.add_argument('--info', action='store_true', default=False,
                            help='Solo mostrar el estado actual, sin crear ni modificar')

    def handle(self, *args, **options):
        from apps.facturacion.models import ConfiguracionAFIP, PuntoVenta

        if options['info']:
            self._mostrar_info()
            return

        ambiente = 'P' if options['produccion'] else 'H'
        pv_numero = options['pv']

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Setup Facturación AFIP/ARCA ===\n'))

        # Verificar certificados
        if not CERT_FILE.exists():
            raise CommandError(f'Certificado no encontrado: {CERT_FILE}')
        if not KEY_FILE.exists():
            raise CommandError(f'Clave privada no encontrada: {KEY_FILE}')

        cert_content = CERT_FILE.read_text(encoding='utf-8').strip()
        key_content = KEY_FILE.read_text(encoding='utf-8').strip()

        if '-----BEGIN CERTIFICATE-----' not in cert_content:
            raise CommandError('El archivo .crt no parece ser un certificado PEM válido')
        if '-----BEGIN' not in key_content:
            raise CommandError('El archivo .key no parece ser una clave privada PEM válida')

        self.stdout.write(f'  Certificado: {CERT_FILE.name} OK')
        self.stdout.write(f'  Clave privada: {KEY_FILE.name} OK')

        # Crear o actualizar ConfiguracionAFIP
        config, created = ConfiguracionAFIP.objects.update_or_create(
            cuit_emisor=CUIT_DEFAULT,
            defaults={
                'razon_social': RAZON_SOCIAL_DEFAULT,
                'domicilio_comercial': DOMICILIO_DEFAULT,
                'condicion_iva': 'RI',
                'inicio_actividades': INICIO_ACTIVIDADES_DEFAULT,
                'ambiente': ambiente,
                'certificado': cert_content,
                'clave_privada': key_content,
                'activo': True,
            }
        )
        accion = 'Creado' if created else 'Actualizado'
        self.stdout.write(self.style.SUCCESS(
            f'\n  ConfiguracionAFIP {accion}: CUIT {CUIT_DEFAULT} — Ambiente {config.get_ambiente_display()}'
        ))

        # Crear PuntoVenta
        pv, pv_created = PuntoVenta.objects.get_or_create(
            numero=pv_numero,
            defaults={'nombre': 'Local Principal', 'activo': True}
        )
        pv_accion = 'Creado' if pv_created else 'Ya existe'
        self.stdout.write(self.style.SUCCESS(
            f'  PuntoVenta {pv_accion}: PV {pv_numero:04d} — {pv.nombre}'
        ))

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Próximos pasos ==='))
        self.stdout.write('  1. Ajustar domicilio y fecha inicio en Admin si es necesario:')
        self.stdout.write('     http://localhost:8000/admin → Facturación → Configuracion AFIPs')
        self.stdout.write('  2. Probar conexión:')
        self.stdout.write(f'     POST /api/facturacion/configuracion-afip/{config.id}/probar_conexion/')
        self.stdout.write('  3. Si la prueba es exitosa, emitir primera factura de prueba en Homologación')
        if ambiente == 'H':
            self.stdout.write('  4. Para activar Producción, editar ConfiguracionAFIP → Ambiente = P')
        self.stdout.write('')

    def _mostrar_info(self):
        from apps.facturacion.models import ConfiguracionAFIP, PuntoVenta

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Estado actual de Facturación AFIP ===\n'))

        configs = ConfiguracionAFIP.objects.all()
        if not configs.exists():
            self.stdout.write(self.style.WARNING('  ConfiguracionAFIP: NO EXISTE — ejecutar setup_afip para crearla'))
        else:
            for c in configs:
                tiene_cert = bool(c.certificado)
                tiene_key = bool(c.clave_privada)
                self.stdout.write(f'  ConfiguracionAFIP id={c.id}:')
                self.stdout.write(f'    CUIT: {c.cuit_emisor}')
                self.stdout.write(f'    Ambiente: {c.get_ambiente_display()}')
                self.stdout.write(f'    Certificado: {"OK" if tiene_cert else "FALTA"}')
                self.stdout.write(f'    Clave privada: {"OK" if tiene_key else "FALTA"}')
                self.stdout.write(f'    Token válido: {c.token_expiracion or "No obtenido"}')

        pvs = PuntoVenta.objects.all()
        if not pvs.exists():
            self.stdout.write(self.style.WARNING('  PuntoVenta: NINGUNO — ejecutar setup_afip para crear el PV 1'))
        else:
            for pv in pvs:
                self.stdout.write(f'  PuntoVenta {pv.numero:04d}: {pv.nombre}')
                self.stdout.write(f'    Último FA: {pv.ultimo_numero_factura_a}')
                self.stdout.write(f'    Último FB: {pv.ultimo_numero_factura_b}')
                self.stdout.write(f'    Último FC: {pv.ultimo_numero_factura_c}')

        self.stdout.write('')

        # Verificar pyafipws
        try:
            from pyafipws.wsaa import WSAA
            from pyafipws.wsfev1 import WSFEv1
            self.stdout.write(self.style.SUCCESS('  pyafipws: instalado OK'))
        except ImportError:
            self.stdout.write(self.style.ERROR('  pyafipws: NO INSTALADO — pip install git+https://github.com/reingart/pyafipws.git'))

        # Verificar certificados en disco
        self.stdout.write(f'  Cert en disco: {"OK" if CERT_FILE.exists() else "FALTA " + str(CERT_FILE)}')
        self.stdout.write(f'  Key en disco:  {"OK" if KEY_FILE.exists() else "FALTA " + str(KEY_FILE)}')
        self.stdout.write('')
