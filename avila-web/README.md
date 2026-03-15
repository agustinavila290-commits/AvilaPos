# Avila Web – Sitio público

Sitio público de **Avila Motor Repuesto** (avilamotorepuesto.com.ar): landing, política de privacidad, términos de uso, contacto y estructura preparada para futura tienda online.

## Repositorio separado del POS

Este proyecto es independiente del **Sistema POS** (backend Django + frontend React), que está en otro repositorio. Ver [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md) para la relación entre ambos y las URLs usadas en Clover.

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre http://localhost:5174

## Build

```bash
npm run build
```

Salida en `dist/`. Desplegar en Netlify, Vercel o Cloudflare Pages con dominio avilamotorepuesto.com.ar.

## Rutas

- `/` — Inicio
- `/privacidad` — Política de privacidad
- `/terminos` — Términos de uso (EULA)
- `/contacto` — Contacto

## Estructura

Ver [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md).
