import rehypePrettyCode, { type Options } from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { rehypeCodeCopyButton } from '@/lib/rehype-code-copy-button';
import { rehypeLinkCard } from '@/lib/rehype-link-card';
import { rehypeMermaidCodeToDiv } from '@/lib/rehype-mermaid-code';
import { MarkdownContent } from './markdown-content';

type CustomMarkdownProps = {
  source: string;
};

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
 * Markdownコンテンツをremark/rehypeプラグインを使用してレンダリングするコンポーネント
 *
 * このコンポーネントはMarkdownソースを受け取り、HTMLとして処理・表示します。
 * GFM(GitHub Flavored Markdown)、リンクカード、GitHubスタイルのアラート、
 * シンタックスハイライト、コードコピーボタンなど、多くの機能をサポートしています。
 * エラーが発生した場合は、エラーメッセージを表示します。
 *
 * セキュリティ: allowDangerousHtml を有効化していますが、
 * リンクカード生成時にDOMPurifyでサニタイズしているため安全です。
 *
 * @param source - レンダリングするMarkdownソース文字列
 * @returns レンダリングされたMarkdownコンポーネント。エラー時はエラーメッセージを含むdivを返します
 *
 */
export async function CustomMarkdown({ source }: CustomMarkdownProps) {
  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkBreaks)
      .use(remarkAlert)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeLinkCard)
      .use(rehypeMermaidCodeToDiv)
      .use(rehypePrettyCode, rehypePrettyCodeOptions)
      .use(rehypeCodeCopyButton)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(source);

    return <MarkdownContent html={String(result)} />;
  } catch (error) {
    console.error('Error rendering Markdown:', error);
    return (
      <div className='rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive'>
        An error occurred while rendering the content.
      </div>
    );
  }
}
