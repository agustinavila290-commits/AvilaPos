# Prompts para generar imágenes con IA — Avila Moto Repuestos

Usar estos prompts en herramientas como Midjourney, DALL·E 3, Stable Diffusion o Adobe Firefly.
Guardar los resultados en las rutas indicadas.

**REGLA IMPORTANTE:**
No incluir logos, marcas registradas, textos ni nombres de empresas en las imágenes.
Las imágenes deben ser visuales de apoyo, no copiar identidades de marca.

---

## BANNERS PRINCIPALES

### Hero principal (desktop)
**Ruta:** `public/assets/ai/banners/hero-main.webp`
**Dimensiones:** 1920×800px

```
Modern premium motorcycle parts e-commerce hero banner, urban sport motorcycle
in a dark high-tech garage workshop, red neon accent lighting, spare parts
components surrounding the bike (brake disc, chain, filters, battery),
dramatic cinematic lighting, no text, no logos, no brand names,
photorealistic commercial style, dark background, 16:9 aspect ratio,
high detail, professional product photography mood
```

---

### Hero mobile
**Ruta:** `public/assets/ai/banners/hero-mobile.webp`
**Dimensiones:** 800×1000px

```
Vertical format mobile banner, sport motorcycle close-up detail shot,
dark background with red accent lighting, dramatic shadows,
bokeh background with garage tools, photorealistic, no text, no logos,
9:16 aspect ratio, commercial photography style
```

---

### Fondo racing (decorativo)
**Ruta:** `public/assets/ai/backgrounds/racing-bg.webp`
**Dimensiones:** 1920×600px

```
Abstract racing speed lines background for motorcycle parts store,
carbon fiber texture dark base, red neon light streaks suggesting speed
and motion, modern ecommerce dark aesthetic, no text, no logos,
wide banner 16:4 ratio, graphic design style
```

---

### Fondo mecánico (decorativo)
**Ruta:** `public/assets/ai/backgrounds/mechanic-tools.webp`
**Dimensiones:** 1280×720px

```
Premium motorcycle workshop background, organized mechanical tools
on dark metal workbench, red accent lighting, professional garage
atmosphere, dramatic shadows, no people, no text, no brand logos,
photorealistic, dark mood
```

---

## CATEGORÍAS

### Aceites y lubricantes
**Ruta:** `public/assets/ai/categories/aceites.webp`
**Dimensiones:** 600×450px

```
Motorcycle engine oil category image, motor oil containers and bottles
arranged on dark garage floor, red accent light from the side,
premium dark product photography, no brand logos visible, no text,
4:3 aspect ratio, commercial ecommerce style
```

---

### Cubiertas / Neumáticos
**Ruta:** `public/assets/ai/categories/cubiertas.webp`
**Dimensiones:** 600×450px

```
Motorcycle tires category image, two sport motorcycle tires leaning
against dark workshop wall, dramatic side lighting, red accent glow,
premium product photography style, no logos, no text, 4:3 format
```

---

### Cascos
**Ruta:** `public/assets/ai/categories/cascos.webp`
**Dimensiones:** 600×450px

```
Motorcycle helmet category image, dark full-face helmet on sleek dark
surface with dramatic lighting, red reflection accents, premium product
photography, no brand logos, no text, 4:3 ratio
```

---

### Transmisión
**Ruta:** `public/assets/ai/categories/transmision.webp`
**Dimensiones:** 600×450px

```
Motorcycle chain and sprocket transmission parts, dark metallic
components arranged on workshop floor, dramatic blue-red accent
lighting, close-up macro photography, no logos, no text, 4:3 format
```

---

### Frenos
**Ruta:** `public/assets/ai/categories/frenos.webp`
**Dimensiones:** 600×450px

```
Motorcycle brake parts category, brake disc and brake pads on dark
surface, red accent lighting creating dramatic highlights on metal
surfaces, premium product photography, no logos, no text, 4:3 format
```

---

### Baterías
**Ruta:** `public/assets/ai/categories/baterias.webp`
**Dimensiones:** 600×450px

```
Motorcycle battery category image, modern motorbike battery on dark
workshop bench, subtle blue-green electrical glow effect, dramatic
lighting, premium product photography, no logos, no text, 4:3 ratio
```

---

### Filtros
**Ruta:** `public/assets/ai/categories/filtros.webp`
**Dimensiones:** 600×450px

```
Motorcycle air and oil filters category, various filter components
arranged on dark surface, industrial garage atmosphere, red lighting
accents, product photography style, no logos, no text, 4:3 format
```

---

### Accesorios
**Ruta:** `public/assets/ai/categories/accesorios.webp`
**Dimensiones:** 600×450px

```
Motorcycle accessories category image, various rider accessories and
parts on dark background, premium product photography, colorful but
dark-toned, commercial ecommerce style, no logos, no text, 4:3 format
```

---

### Iluminación
**Ruta:** `public/assets/ai/categories/iluminacion.webp`
**Dimensiones:** 600×450px

```
Motorcycle LED lighting parts category, various headlights and
indicators glowing in dark, dramatic light effects, modern product
photography, no text, no logos, 4:3 aspect ratio
```

---

### Herramientas
**Ruta:** `public/assets/ai/categories/herramientas.webp`
**Dimensiones:** 600×450px

```
Professional motorcycle mechanic tools category, organized spanners
and tools on dark metal surface, dramatic workshop lighting,
industrial aesthetic, no text, no logos, 4:3 ratio
```

---

## NOTAS TÉCNICAS

- Exportar en formato WebP para mejor performance.
- Comprimir a calidad 85-90 (máx 150KB por categoría, máx 350KB banners).
- Verificar que no haya textos, logos ni marcas reconocibles.
- Si el resultado tiene textos, regenerar o recortar la zona.

## HERRAMIENTAS RECOMENDADAS

- **Midjourney v6** — Mejor calidad fotorrealista
- **DALL·E 3** — Fácil de usar, buen control de composición
- **Adobe Firefly** — Sin problemas de copyright por diseño
- **Stable Diffusion XL** — Control total, local o en la nube
- **Leonardo.ai** — Bueno para estilos específicos

## ORGANIZACIÓN FINAL

```
public/
  assets/
    ai/
      banners/
        hero-main.webp
        hero-mobile.webp
      backgrounds/
        racing-bg.webp
        mechanic-tools.webp
      categories/
        aceites.webp
        cubiertas.webp
        cascos.webp
        transmision.webp
        frenos.webp
        baterias.webp
        filtros.webp
        accesorios.webp
        iluminacion.webp
        herramientas.webp
    brands/
      motos/          ← logos oficiales (cargar manualmente)
      repuestos/      ← logos oficiales (cargar manualmente)
    placeholders/     ← fallbacks
```
