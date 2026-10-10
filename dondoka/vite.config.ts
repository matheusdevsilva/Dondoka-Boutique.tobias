import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target, changeOrigin: false },
        '/uploads': { target, changeOrigin: false },
      },
    },
  }
})
