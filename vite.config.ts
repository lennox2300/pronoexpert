import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { generateSWVersionPlugin } from './build-scripts/sw-version-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), generateSWVersionPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
