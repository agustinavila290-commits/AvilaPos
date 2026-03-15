"""
Middleware para eximir la API REST de la comprobación CSRF.
La API usa JWT; las peticiones desde el mismo dominio (ej. avilamotorepuesto.com.ar)
no envían cookie CSRF en el POST de login, por lo que Django devolvería 403.
"""


class DisableCSRFForAPIMiddleware:
    """Exime las rutas /api/ de la comprobación CSRF (auth vía JWT)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/api/"):
            request.csrf_processing_done = True
        return self.get_response(request)
