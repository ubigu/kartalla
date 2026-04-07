// @ts-strict-ignore
import react from '@vitejs/plugin-react';
import 'dotenv/config';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const proxyAddress = process.env.API_URL ?? 'http://localhost:3000';
const appVersion = process.env.APP_VERSION ?? 'local-dev';
const enabledFeatures = process.env.VITE_ENABLED_FEATURES ?? '[]';

const isAdminRoute = (url: string) => url.startsWith('/admin');
const isIndexRoute = (url: string) =>
  !url.startsWith('/api') &&
  !url.startsWith('/login') &&
  !url.startsWith('/.auth') &&
  !url.startsWith('/logout') &&
  !url.startsWith('/@') &&
  !url.includes('.');

export default defineConfig({
  appType: 'mpa',
  plugins: [
    react(),
    tsconfigPaths(),
    {
      name: 'rewrite-middleware',
      configureServer(config) {
        // Rewrite all /admin paths to use the admin client application
        config.middlewares.use((req, _res, next) => {
          if (isAdminRoute(req.url)) {
            req.url = '/admin/';
          } else if (isIndexRoute(req.url)) {
            req.url = '/';
          }
          next();
        });
      },
    },
  ],
  define: {
    APP_VERSION: JSON.stringify(appVersion),
    ENABLED_FEATURES: JSON.stringify(enabledFeatures),
  },
  optimizeDeps: {
    include: ['draft-convert'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    watch: {
      usePolling: process.env.VITE_USE_POLLING === 'true',
    },
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': proxyAddress,
      '/login': proxyAddress,
      '/.auth': proxyAddress,
      '/logout': proxyAddress,
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name]/entry-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
