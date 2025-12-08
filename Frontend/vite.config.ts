import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Vi loader miljøvariabler, hvis de findes (god praksis)
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // PROXY SETUP: Gør systemet klar til lokal udvikling i fremtiden.
        // Hvis koden kalder '/app/login', sender Vite det videre til localhost:80 (standard PHP port)
        proxy: {
            '/app': {
                target: 'http://localhost:80', // Tilpas denne port hvis din lokale PHP server bruger f.eks. 8888 eller 8000
                changeOrigin: true,
                secure: false,
            }
        }
      },
      plugins: [react()],
      // Vi har fjernet 'define' blokken med GEMINI_API_KEY, da den var ubrugt (dead code)
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});