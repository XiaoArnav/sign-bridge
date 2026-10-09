/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: '#0B1220',
        surface: '#151F30',
        'surface-elevated': '#1A273D',
        'surface-border': '#24344E',
        teal: {
          DEFAULT: '#43D9C2',
          hover: '#38C5B0',
          muted: 'rgba(67, 217, 194, 0.12)',
        },
        rastaText: {
          primary: '#E8EEF7',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        severity: {
          critical: '#EF4444',
          high: '#F59E0B',
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
