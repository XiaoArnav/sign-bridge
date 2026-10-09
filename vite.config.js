import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
    proxy: {
      // Proxy 1: NDMA SACHET National Disaster Alert RSS Feed
      '/api/sachet': {
        target: 'https://sachet.ndma.gov.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sachet/, '/cap_public_website/rss/rss_india.xml'),
        secure: false,
      },
      // Proxy 2: Google News RSS for Indian Road & Civic Hazards (Bengaluru/India)
      '/api/news': {
        target: 'https://news.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '/rss/search?q=Bengaluru+pothole+OR+waterlogging+OR+manhole+when:7d&hl=en-IN&gl=IN&ceid=IN:en'),
        secure: false,
      }
    }
  }
})
