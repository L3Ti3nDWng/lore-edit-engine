import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // `npm run dev:api` serves functions/ on 8788. The Host header is kept, so the
  // API sees http://localhost:5173 as its origin (cookies, OAuth redirect URI).
  server: {
    proxy: { '/api': { target: 'http://localhost:8788', changeOrigin: false } },
  },
});
