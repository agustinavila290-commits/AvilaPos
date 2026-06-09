/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-brand-dark', 'text-brand-dark', 'border-brand-dark',
    'bg-carbon', 'bg-graphite', 'bg-plate', 'bg-steel',
    'animate-fade-in-up', 'animate-fade-in', 'animate-pulse-wa',
    'clip-hero', 'speed-lines',
  ],
  theme: {
    extend: {
      colors: {
        // Existing brand palette (unchanged for backwards compat)
        brand: {
          blue:        '#DC2626',
          'blue-dark': '#991B1B',
          green:       '#16A34A',
          red:         '#DC2626',
          bg:          '#F3F4F6',
          border:      '#E5E7EB',
          text:        '#111827',
          muted:       '#6B7280',
          dark:        '#1F2937',
        },
        // Racing palette (dark estética)
        carbon:   '#09090B',
        graphite: '#111118',
        plate:    '#1C1C26',
        steel:    '#28283A',
        // Rojo vivaz
        'avila': {
          red:    '#DC2626',
          'red-v':'#EF4444',
          yellow: '#F59E0B',
          green:  '#16A34A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseWa: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(22,163,74,0.5)' },
          '60%':      { boxShadow: '0 0 0 10px rgba(22,163,74,0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400% 0' },
          '100%': { backgroundPosition:  '400% 0' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%':  { transform: 'scale(1.3)' },
          '50%':  { transform: 'scale(0.9)' },
          '75%':  { transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in-up':   'fadeInUp 0.5s ease-out both',
        'fade-in-left': 'fadeInLeft 0.5s ease-out both',
        'fade-in':      'fadeIn 0.4s ease-out both',
        'scale-in':     'scaleIn 0.4s ease-out both',
        'pulse-wa':     'pulseWa 2.5s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'marquee':      'marquee 28s linear infinite',
        'marquee-fast': 'marquee 16s linear infinite',
        'marquee-slow': 'marquee 40s linear infinite',
        'slide-down':   'slideDown 0.3s ease-out both',
        'heartbeat':    'heartbeat 0.4s ease-in-out',
        'float':        'float 3s ease-in-out infinite',
      },
      backgroundImage: {
        'shimmer-card':  'linear-gradient(90deg, #1C1C26 25%, #28283A 50%, #1C1C26 75%)',
        'shimmer-light': 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        'red-glow':      'radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, transparent 70%)',
        'hero-gradient': 'linear-gradient(135deg, #09090B 0%, #1C0A0A 50%, #09090B 100%)',
      },
      boxShadow: {
        'red-glow':    '0 0 20px rgba(220,38,38,0.4), 0 0 60px rgba(220,38,38,0.1)',
        'red-glow-sm': '0 0 10px rgba(220,38,38,0.3)',
        'card-hover':  '0 20px 40px rgba(0,0,0,0.2)',
        'dark':        '0 4px 20px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
