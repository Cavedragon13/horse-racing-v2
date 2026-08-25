import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/horse-racing-v2/',
  server: {
    port: 8030,
    strictPort: true,   // fail instead of silently grabbing another port
    host: '0.0.0.0',
  },
})
