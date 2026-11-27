import { unified } from '@astrojs/markdown-remark';
import { defineConfig, fontProviders } from 'astro/config';
import { pagefindDev } from './src/integrations/pagefind-dev.ts';
import { rehypeArticle } from './src/markdown/rehype-article.ts';
import { remarkArticle } from './src/markdown/remark-article.ts';

export default defineConfig({
  output: 'static',
  site: 'https://suntory-n-water.com',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [pagefindDev()],
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      smartypants: false,
      remarkPlugins: [remarkArticle],
      rehypePlugins: [rehypeArticle],
      remarkRehype: {
        footnoteLabel: '脚注',
        footnoteLabelProperties: { className: ['footnotes-heading'] },
        footnoteBackLabel: (referenceIndex, rereferenceIndex) =>
          `本文の ${referenceIndex + 1} 番目の参照${rereferenceIndex > 1 ? `（${rereferenceIndex} 回目）` : ''}に戻る`,
      },
    }),
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-latin',
      weights: [400, 500, 600, 700],
      subsets: ['latin', 'latin-ext'],
      fallbacks: [],
    },
    {
      provider: fontProviders.google(),
      name: 'Noto Sans JP',
      cssVariable: '--font-jp',
      weights: [400, 500, 600],
      subsets: ['japanese', 'latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono-latin',
      weights: [400, 500],
      subsets: ['latin', 'latin-ext'],
      fallbacks: [],
    },
  ],
  devToolbar: { enabled: false },
  vite: {
    build: { cssTarget: ['chrome123', 'edge123', 'firefox120', 'safari17.5'] },
  },
});
