// @ts-check

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkAlert from 'remark-github-blockquote-alert';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';

// カスタムrehypeプラグイン
// import { rehypeLinkCard } from './src/lib/rehype-link-card.js';
import { rehypeMermaidCodeToDiv } from './src/lib/rehype-mermaid-code.js';
import { rehypeCodeCopyButton } from './src/lib/rehype-code-copy-button.js';

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url))
			}
		},
		build: {
			rollupOptions: {
				external: ['/pagefind/pagefind-ui.js']
			}
		}
	},
	// TODO: これ消しても src/components/feature/content/custom-markdown.tsx で定義しているから今動いちゃうぞ
	markdown: {
		// シンタックスハイライト設定（rehypePrettyCodeを使用するため無効化）
		syntaxHighlight: false,
		// remarkプラグイン
		remarkPlugins: [
			remarkGfm,
			remarkBreaks,
			remarkAlert,
		],
		// rehypeプラグイン
		rehypePlugins: [
			rehypeSlug,
			// rehypeLinkCard,
			rehypeMermaidCodeToDiv,
			[rehypePrettyCode, {
				theme: 'slack-dark',
				keepBackground: true,
				defaultLang: 'plaintext',
				// ファイル名をtitle属性に変換
				filterMetaString: (meta) => {
					if (!meta) {
						return meta;
					}
					// すでにtitle属性がある場合はそのまま返す
					if (meta.includes('title=')) {
						return meta;
					}
					// ファイル名っぽい文字列(拡張子を含む)を検出
					const match = meta.match(/^([^\s{]+\.\w+)(.*)$/);
					if (match) {
						const filename = match[1];
						const rest = match[2] || '';
						return `title="${filename}"${rest}`;
					}
					return meta;
				},
			}],
			rehypeCodeCopyButton,
		],
	},
});
