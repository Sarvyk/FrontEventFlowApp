import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fallback на index.html для SPA-роутинга (BrowserRouter)
    historyApiFallback: true,
    //proxy: {
      //'/api': {
        //target: 'https://localhost:7218',
        //changeOrigin: true,
        //secure: false,
        //rewrite: (path) => path.replace(/^\/api/, '/api')
      //}
    //}
  }
})