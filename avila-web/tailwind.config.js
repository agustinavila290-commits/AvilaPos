/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Safelist fuerza la generación de clases que el JIT podría no detectar
  safelist: [
    'bg-brand-dark',
    'text-brand-dark',
    'border-brand-dark',
    'hover:bg-brand-dark',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primario: rojo (nombre "blue" conservado por compatibilidad con clases existentes)
          blue:        '#DC2626',   // rojo primario
          'blue-dark': '#991B1B',   // rojo oscuro hover
          green:       '#16A34A',   // stock / acciones positivas
          red:         '#DC2626',   // errores (igual al primario)
          bg:          '#F3F4F6',   // fondo general
          border:      '#E5E7EB',   // bordes
          text:        '#111827',   // texto principal
          muted:       '#6B7280',   // texto secundario
          dark:        '#1F2937',   // header / footer / fondos oscuros
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
