"""
Comando para verificar login en el servidor.
Uso:
  python manage.py verificar_login --list
  python manage.py verificar_login USUARIO CONTRASEÑA
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from apps.usuarios.models import Usuario


class Command(BaseCommand):
    help = "Lista usuarios y/o prueba credenciales (para depurar login en producción)"

    def add_arguments(self, parser):
        parser.add_argument("username", nargs="?", default=None, help="Usuario a probar")
        parser.add_argument("password", nargs="?", default=None, help="Contraseña")
        parser.add_argument(
            "--list",
            action="store_true",
            help="Solo listar usuarios existentes",
        )

    def handle(self, *args, **options):
        if options["list"]:
            self._list_users()
            return

        username = (options.get("username") or "").strip()
        password = options.get("password")

        if not username or password is None:
            self.stdout.write("Uso: python manage.py verificar_login USUARIO CONTRASEÑA")
            self.stdout.write("     python manage.py verificar_login --list")
            return

        self._test_login(username, password)

    def _list_users(self):
        users = Usuario.objects.all().order_by("username")
        if not users.exists():
            self.stdout.write(self.style.WARNING("No hay usuarios en la base de datos."))
            return
        self.stdout.write("Usuarios en la base de datos:")
        for u in users:
            estado = "activo" if u.is_active else "INACTIVO"
            self.stdout.write(
                f"  - {u.username} (email={u.email}, rol={u.rol}, {estado})"
            )

    def _test_login(self, username, password):
        user = Usuario.objects.filter(username=username).first()
        if not user:
            self.stdout.write(self.style.ERROR(f"Usuario '{username}' no existe."))
            self.stdout.write("Usuarios existentes: python manage.py verificar_login --list")
            return

        self.stdout.write(f"Usuario '{username}' existe. Probando authenticate()...")
        auth_user = authenticate(username=username, password=password)
        if auth_user:
            self.stdout.write(self.style.SUCCESS("OK - Las credenciales son correctas."))
            return

        self.stdout.write(
            self.style.ERROR("FALLO - Contraseña incorrecta o usuario inactivo.")
        )
        self.stdout.write(f"  is_active={user.is_active}")
        self.stdout.write(
            "Para resetear contraseña: python manage.py changepassword " + username
        )
