/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem',
      },
      colors: {
        // Sarvam AI Inspired Design System
        sarvam: {
          bg: '#FAF9F6',
          surface: '#FFFFFF',
          subtle: '#F3F3F0',
          border: '#E7E5E0',
          borderStrong: '#D3D0C9',
          text: '#171717',
          secondary: '#626262',
          muted: '#858585',
          accent: '#4F46E5',
          accentHover: '#4338CA',
          live: '#0F8B72',
          warning: '#B7791F',
          critical: '#C62828',
          verified: '#15803D',
        },
        // Direct theme mapping
        apple: {
          bg: '#FAF9F6',
          card: '#FFFFFF',
          subtle: '#F3F3F0',
          border: '#E7E5E0',
          borderStrong: '#D3D0C9',
          text: '#171717',
          secondary: '#626262',
          muted: '#858585',
          blue: '#4F46E5',
          blueHover: '#4338CA',
          green: '#15803D',
          amber: '#B7791F',
          red: '#C62828',
        },
        // Backward compatibility tokens for Authority Workspace & components
        midnight: '#FAF9F6',
        surface: '#FFFFFF',
        'surface-elevated': '#F3F3F0',
        'surface-border': '#E7E5E0',
        teal: {
          DEFAULT: '#0F8B72',
          hover: '#0B6D59',
          muted: 'rgba(15, 139, 114, 0.1)',
        },
        rastaText: {
          primary: '#171717',
          secondary: '#626262',
          muted: '#858585',
        },
        severity: {
          critical: '#C62828',
          high: '#B7791F',
          medium: '#4F46E5',
          low: '#858585',
          verified: '#15803D',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.04)',
        md: '0 2px 6px rgba(0, 0, 0, 0.04)',
        lg: '0 4px 14px rgba(0, 0, 0, 0.05)',
        xl: '0 8px 20px rgba(0, 0, 0, 0.06)',
        '2xl': '0 12px 28px rgba(0, 0, 0, 0.06)',
        inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'apple': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'apple-md': '0 6px 20px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)',
        'apple-lg': '0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
