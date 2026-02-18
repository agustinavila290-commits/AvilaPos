"""
Utilidad para comprimir imágenes de facturas al subir.
"""
import io
from django.core.files.base import ContentFile


def comprimir_imagen_factura(archivo_subido, calidad=85, ancho_max=1600):
    """
    Comprime una imagen para ahorrar espacio.
    Convierte a JPEG si es posible y redimensiona si supera ancho_max.

    Returns:
        ContentFile con la imagen comprimida (formato JPEG), o None si falla.
    """
    try:
        from PIL import Image
    except ImportError:
        return None

    try:
        img = Image.open(archivo_subido)
        # Convertir a RGB si tiene canal alpha (PNG)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        ancho, alto = img.size
        if ancho > ancho_max:
            ratio = ancho_max / ancho
            nuevo_alto = int(alto * ratio)
            img = img.resize((ancho_max, nuevo_alto), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=calidad, optimize=True)
        buffer.seek(0)

        nombre = archivo_subido.name
        if not nombre.lower().endswith('.jpg') and not nombre.lower().endswith('.jpeg'):
            nombre = nombre.rsplit('.', 1)[0] + '.jpg' if '.' in nombre else nombre + '.jpg'

        return ContentFile(buffer.getvalue(), name=nombre)
    except Exception:
        return None
