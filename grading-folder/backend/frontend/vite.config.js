import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', //  inside frontend
  },
  base: './', // 👈 SUPER important: makes all assets use relative paths
})
