import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; 

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
  server: {
    // Whitelist your specific Ngrok domain
    allowedHosts: [
      'monitor-carwash-hemstitch.ngrok-free.dev'
    ],
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});