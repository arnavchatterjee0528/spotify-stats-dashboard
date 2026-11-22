import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app runs on 127.0.0.1 (Spotify rejects "localhost" redirect URIs).
// /api requests are proxied to Express so login cookies stay on one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:5000' },
  },
});
