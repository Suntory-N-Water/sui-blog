import rehypeMermaid from 'rehype-mermaid';
import rehypePrettyCode, { type Options } from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { rehypeCloudflareImages } from '@/lib/rehype-cloudflare-images';
import { rehypeCodeCopyButton } from '@/lib/rehype-code-copy-button';
import { rehypeLinkCard } from '@/lib/rehype-link-card';
import { rehypeAddMermaidClass } from '@/lib/rehype-mermaid-class';
import { rehypeR2ImageUrl } from '@/lib/rehype-r2-image-url';
import { rehypeRichEmbed } from '@/lib/rehype-rich-embed';

const rehypePrettyCodeOptions: Options = {
  theme: 'slack-dark',
  keepBackground: true,
  defaultLang: 'plaintext',
  // ファイル名をtitle属性に変換
  // 例: utils.ts -> title="utils.ts"
  // 例: utils.ts {1-3} -> title="utils.ts" {1-3}
  filterMetaString: (meta: string) => {
    if (!meta) {
      return meta;
    }

    // すでにtitle属性がある場合はそのまま返す
    if (meta.includes('title=')) {
      return meta;
    }

    // ファイル名っぽい文字列(拡張子を含む)を検出
    // 例: utils.ts, index.js, main.py など
    const match = meta.match(/^([^\s{]+\.\w+)(.*)$/);
    if (match) {
      const [, filename, rest] = match;
      return `title="${filename}"${rest}`;
    }

    return meta;
  },
};

/**
 * remarkプロセッサーをモジュールレベルで構築
 * プラグインの初期化オーバーヘッドを削減し、ビルド速度を向上
 */
const processor = remark()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkAlert)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeR2ImageUrl)
  .use(rehypeCloudflareImages)
  .use(rehypeRichEmbed)
  .use(rehypeLinkCard)
  .use(rehypeAddMermaidClass)
  .use(rehypeMermaid, {
    strategy: 'img-svg',
    dark: true,
  })
  .use(rehypePrettyCode, rehypePrettyCodeOptions)
  .use(rehypeCodeCopyButton)
  .use(rehypeStringify, { allowDangerousHtml: true });

/**
 * Markdownコンテンツをremark/rehypeプラグインを使用してレンダリングするコンポーネント
 */
export async function compileMarkdown({ source }: { source: string }) {
  const result = await processor.process(source);
  return String(result);
}
