import { renderMermaidSVGAsync } from 'beautiful-mermaid';
import { type BundledLanguage, bundledLanguagesInfo, createHighlighter } from 'shiki';
import { escapeHtml } from './html';

const CODE_THEME = 'dark-plus';
const PLAIN_LANGUAGES = new Set(['', 'plaintext', 'plain', 'text', 'txt']);
const SUPPORTED_LANGUAGES = new Set(
  bundledLanguagesInfo.flatMap((info) => [info.id, ...(info.aliases ?? [])]),
);

const COPY_BUTTON = `<button type="button" class="code-copy" aria-label="コードをコピー"><svg class="code-copy-icon copy" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><svg class="code-copy-icon done" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg></button>`;

const highlighterPromise = createHighlighter({ themes: [CODE_THEME], langs: [] });

function resolveLanguage(language: string | null | undefined): string {
  const lower = (language ?? '').toLowerCase();
  if (PLAIN_LANGUAGES.has(lower) || !SUPPORTED_LANGUAGES.has(lower)) {
    return 'text';
  }
  return lower;
}

export function isMermaid(language: string | null | undefined): boolean {
  return language?.toLowerCase() === 'mermaid';
}

export async function renderCodeBlock(
  code: string,
  language: string | null | undefined,
  filename: string | null | undefined,
): Promise<string> {
  const highlighter = await highlighterPromise;
  const lang = resolveLanguage(language);
  if (lang !== 'text' && !highlighter.getLoadedLanguages().includes(lang)) {
    await highlighter.loadLanguage(lang as BundledLanguage);
  }
  const highlighted = highlighter.codeToHtml(code, { lang, theme: CODE_THEME });
  const caption = filename
    ? `<figcaption class="code-block-filename">${escapeHtml(filename)}</figcaption>`
    : '';
  return `<figure class="code-block">${caption}<div class="code-block-body">${highlighted}${COPY_BUTTON}</div></figure>`;
}

const MERMAID_FONT_TOKEN = '__site-font__';

const MERMAID_THEME = {
  bg: 'transparent',
  fg: 'light-dark(#333333, #ededed)',
  accent: 'light-dark(#0066cc, #64b5ff)',
  muted: 'light-dark(#595959, #b3b3b3)',
  surface: 'light-dark(#f5f5f7, #333333)',
  border: 'light-dark(#dbdbdb, #474747)',
  line: 'light-dark(#dbdbdb, #474747)',
  font: MERMAID_FONT_TOKEN,
  transparent: true,
  padding: 8,
};

export async function renderMermaid(code: string): Promise<string> {
  try {
    const svg = (await renderMermaidSVGAsync(code, MERMAID_THEME))
      .replace(/[ \t]*@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);\n?/gu, '')
      .replaceAll(`'${MERMAID_FONT_TOKEN}'`, 'var(--font-body)')
      .replaceAll("'JetBrains Mono'", 'var(--font-mono)');
    return `<figure class="mermaid-figure">${svg}</figure>`;
  } catch (error) {
    console.warn('Mermaid の図を SVG にできなかったため、元のコードを表示します。', error);
    return `<figure class="mermaid-figure"><pre class="mermaid-source">${escapeHtml(code)}</pre></figure>`;
  }
}
