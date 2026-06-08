/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:        '#2563EB',
          'blue-dark': '#1E3A8A',
          green:       '#16A34A',
          red:         '#DC2626',
          bg:          '#F3F4F6',
          border:      '#E5E7EB',
          text:        '#111827',
          muted:       '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
