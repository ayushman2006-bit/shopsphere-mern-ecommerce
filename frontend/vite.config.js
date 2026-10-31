import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, Vite forwards /api and /uploads requests to the Express server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
