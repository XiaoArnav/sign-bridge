/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Apple Minimalist Neutral System (Default Light)
        apple: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          subtle: '#F2F2F7',
          border: '#E5E5EA',
          borderStrong: '#D2D2D7',
          text: '#1D1D1F',
          secondary: '#6E6E73',
          muted: '#86868B',
          blue: '#0071E3',
          blueHover: '#0077ED',
          green: '#34C759',
          amber: '#FF9500',
          red: '#FF3B30',
        },
        // Backward compatibility tokens for Authority Workspace
        midnight: '#0B1220',
        surface: '#111827',
        'surface-elevated': '#151F30',
        'surface-border': '#334155',
        teal: {
          DEFAULT: '#0071E3', // Apple Blue primary
          hover: '#0077ED',
          muted: 'rgba(0, 113, 227, 0.1)',
        },
        rastaText: {
          primary: '#1D1D1F',
          secondary: '#6E6E73',
          muted: '#86868B',
        },
        severity: {
          critical: '#FF3B30',
          high: '#FF9500',
          medium: '#0071E3',
          low: '#86868B',
          verified: '#34C759',
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
