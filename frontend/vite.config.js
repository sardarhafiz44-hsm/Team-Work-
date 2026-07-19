import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Vite ko strictly force kar rahe hain ke in heavy 3D libraries ko pehle se optimize kare
    include: ['three', '@react-three/fiber', '@react-three/drei', 'framer-motion']
  },
  server: {
    // Timeout issues ko handle karne ke liye
    warmup: {
      clientFiles: ['./src/pages/SplashScreen.jsx']
    }
  }
})