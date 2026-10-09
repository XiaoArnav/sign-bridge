/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: '#0B1220',
        surface: '#111827',
        'surface-elevated': '#151F30',
        'surface-border': '#334155',
        teal: {
          DEFAULT: '#43D9C2',
          hover: '#38C5B0',
          muted: 'rgba(67, 217, 194, 0.15)',
        },
        rastaText: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
        },
        severity: {
          critical: '#F87171',
          high: '#FBBF24',
          medium: '#60A5FA',
          low: '#94A3B8',
          verified: '#34D399',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'cyber-lift': '0 4px 20px -2px rgba(67, 217, 194, 0.15)',
        'card-lift': '0 6px 20px -4px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
