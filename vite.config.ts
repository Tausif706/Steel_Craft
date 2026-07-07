import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    /**
     * API proxy — all /api/* requests are forwarded to your Spring Boot / FastAPI backend.
     * Change target to your actual backend URL.
     * Backend API routes are documented in src/api/steelApi.ts
     */
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
