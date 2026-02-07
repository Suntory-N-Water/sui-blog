// @ts-check

import { fileURLToPath } from 'node:url';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { siteConfig } from './src/config/site.js';

// https://astro.build/config
export default defineConfig({
  site: siteConfig.url,
  cacheDir: './node_modules/.astro',
  prefetch: true,
  integrations: [
    sitemap({
      serialize(item) {
        // ブログ記事の場合、最終更新日を設定するなどのカスタマイズが可能
        // 現在はデフォルトの挙動(ビルド日時またはGitの最終コミット)に任せていますが、
        // 必要に応じてここで item.lastmod を上書きできます。
        return item;
      },
    }),
    react(),
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
    concurrency: 4,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // 開発環境のみ: Workers API (localhost:8787) へプロキシ
    ...(process.env.NODE_ENV !== 'production' && {
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:8787',
            changeOrigin: true,
          },
        },
      },
    }),
    optimizeDeps: {
      exclude: ['@resvg/resvg-js'],
    },
    ssr: {
      noExternal: ['satori'],
      external: ['@resvg/resvg-js'],
    },
    build: {
      assetsInlineLimit: 4096,
      rollupOptions: {
        external: ['/pagefind/pagefind-ui.js'],
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'radix-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slot',
            ],
          },
        },
      },
    },
  },
});
