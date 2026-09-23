import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const allDeps = Object.keys(pkg.dependencies || {});
const enableHorizons = process.env.VITE_ENABLE_HORIZONS === 'true';

/**
 * Horizons editor plugins stay on disk (DEFER delete) but are OFF unless
 * VITE_ENABLE_HORIZONS=true. Production builds never inject editor scripts.
 */
async function optionalHorizonsPlugins() {
  if (!enableHorizons) return [];
  const [
    { default: inlineEditPlugin },
    { default: editModeDevPlugin },
    { default: selectionModePlugin },
    { default: iframeRouteRestorationPlugin },
    { default: sitePagesPlugin },
    { default: pocketbaseAuthPlugin },
    { default: sessionJournalPlugin },
  ] = await Promise.all([
    import('./plugins/visual-editor/vite-plugin-react-inline-editor.js'),
    import('./plugins/visual-editor/vite-plugin-edit-mode.js'),
    import('./plugins/selection-mode/vite-plugin-selection-mode.js'),
    import('./plugins/vite-plugin-iframe-route-restoration.js'),
    import('./plugins/vite-plugin-site-pages.js'),
    import('./plugins/vite-plugin-pocketbase-auth.js'),
    import('./plugins/session-journal/vite-plugin-session-journal.js'),
  ]);
  return [
    inlineEditPlugin(),
    editModeDevPlugin(),
    selectionModePlugin(),
    iframeRouteRestorationPlugin(),
    sitePagesPlugin(),
    pocketbaseAuthPlugin(),
    sessionJournalPlugin(),
  ];
}

export default defineConfig(async () => ({
  optimizeDeps: {
    include: allDeps.filter((name) => name !== 'pocketbase'),
  },
  plugins: [
    ...(await optionalHorizonsPlugins()),
    react(),
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
  },
  resolve: {
    extensions: ['.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator',
        '@babel/types',
      ],
    },
  },
}));
