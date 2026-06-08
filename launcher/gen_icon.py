"""
Convierte logo-avila.png al formato .ico multi-resolución.
Recorta el logo centrado, aplica fondo blanco limpio.
"""
from PIL import Image
import os

SRC = "../frontend/public/logo-avila.png"
OUT = "icon.ico"
SIZES = [16, 32, 48, 64, 128, 256]

src = Image.open(SRC).convert("RGBA")

# Recortar automáticamente el bounding box no-blanco
r, g, b, a = src.split()
rgb = Image.merge("RGB", (r, g, b))
bbox = rgb.getbbox()  # recorte del contenido
if bbox:
    src = src.crop(bbox)

frames = []
for size in SIZES:
    # Hacer cuadrado manteniendo aspect ratio con padding
    w, h = src.size
    ratio = min(size / w, size / h)
    nw, nh = int(w * ratio), int(h * ratio)
    resized = src.resize((nw, nh), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    offset = ((size - nw) // 2, (size - nh) // 2)
    canvas.paste(resized, offset, resized)

    # Fondo blanco para evitar artefactos en Windows
    bg = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    bg.paste(canvas, (0, 0), canvas)
    final = bg.convert("RGBA")
    frames.append(final)

frames[0].save(
    OUT,
    format="ICO",
    sizes=[(s, s) for s in SIZES],
    append_images=frames[1:]
)
print(f"Icono generado: {os.path.abspath(OUT)}")
