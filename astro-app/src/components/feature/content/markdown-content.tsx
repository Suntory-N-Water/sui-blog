import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

type MarkdownContentProps = {
  html: string;
};

let mermaidInitialized = false;

/**
 * コンパイル済みMarkdown HTMLを表示するクライアントコンポーネント
 *
 * このコンポーネントはサーバーサイドでコンパイルされたMarkdown HTMLを受け取り、
 * クライアント側でコードブロックにコピーボタンを動的に追加します。
 * dangerouslySetInnerHTMLを使用してHTMLを直接レンダリングし、
 * useEffectフックでコードブロックを検出してコピー機能を付与します。
 *
 * 元のCodeBlockコンポーネント(src/components/feature/content/code-block.tsx)と
 * 同じレイアウト・動作を再現しています。
 *
 * @param html - サーバーサイドでコンパイルされたHTML文字列。rehypeプラグインで処理されたMarkdownのHTML出力です
 * @returns Markdownコンテンツコンポーネント
 */
export function MarkdownContent({ html }: MarkdownContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: html変更時にボタンを再作成する必要がある
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // data-copy-button属性を持つコンテナを検出
    const copyButtonContainers =
      containerRef.current.querySelectorAll('[data-copy-button]');

    const abortController = new AbortController();
    const copiedStates = new Map<
      Element,
      { button: HTMLButtonElement; timeoutId: NodeJS.Timeout | null }
    >();

    copyButtonContainers.forEach((container) => {
      // コピーボタンを作成
      const buttonWrapper = document.createElement('div');
      buttonWrapper.className = 'absolute right-3 top-3';

      // Copied! メッセージコンテナ
      const copiedMessage = document.createElement('div');
      copiedMessage.className =
        'absolute right-10 top-0 z-20 rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-foreground hidden';
      copiedMessage.textContent = 'Copied!';
      buttonWrapper.appendChild(copiedMessage);

      // ボタン要素を作成
      const button = document.createElement('button');
      button.className =
        'z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground size-8 opacity-70 hover:bg-muted/30 hover:opacity-100';
      button.setAttribute('aria-label', 'コードをコピー');

      // Copyアイコン(lucide-react CopyのSVG)
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy text-muted-foreground"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

      buttonWrapper.appendChild(button);
      container.appendChild(buttonWrapper);

      // クリックイベント
      button.addEventListener(
        'click',
        () => {
          const pre = container.previousElementSibling as HTMLPreElement;
          const code = pre?.textContent;

          if (code) {
            navigator.clipboard.writeText(code);

            // Checkアイコンに変更
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>`;

            // Copied!メッセージ表示
            copiedMessage.classList.remove('hidden');

            // 既存のタイムアウトをクリア
            const state = copiedStates.get(container);
            if (state?.timeoutId) {
              clearTimeout(state.timeoutId);
            }

            // 1秒後に元に戻す
            const timeoutId = setTimeout(() => {
              button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy text-muted-foreground"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
              copiedMessage.classList.add('hidden');
            }, 1000);

            copiedStates.set(container, { button, timeoutId });
          }
        },
        { signal: abortController.signal },
      );
    });

    // クリーンアップ
    return () => {
      abortController.abort();
      // 全てのタイムアウトをクリア
      copiedStates.forEach(({ timeoutId }) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    };
  }, [html]);

  useEffect(() => {
    if (!html) {
      return;
    }

    const renderMermaid = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const mermaidBlocks = container.querySelectorAll<HTMLElement>('.mermaid');
      if (mermaidBlocks.length === 0) {
        return;
      }

      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
        });
        mermaidInitialized = true;
      }
      await mermaid.run({
        querySelector: '.mermaid',
        nodes: Array.from(mermaidBlocks),
        suppressErrors: true,
      });
    };

    renderMermaid().catch((error) => {
      console.error('Failed to render Mermaid diagrams:', error);
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className='markdown-content'
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
