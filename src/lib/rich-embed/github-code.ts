import type { Element, ElementContent } from 'hast';
import type { EmbedHandler } from './types';
import { GITHUB_BLOB_RE, isGitHubBlobUrl } from './url-matchers';

/** ファイルサイズ上限（50KB） */
const MAX_FILE_SIZE = 50 * 1024;
/** 行範囲未指定時のデフォルト表示行数 */
const DEFAULT_MAX_LINES = 30;
/** 最大表示行数 */
const MAX_LINES = 50;

/** 拡張子 → 言語名マッピング */
const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  json: 'json',
  toml: 'toml',
  xml: 'xml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sql: 'sql',
  md: 'markdown',
  dockerfile: 'dockerfile',
  astro: 'astro',
  svelte: 'svelte',
  vue: 'vue',
};

/**
 * GitHub blob URLをパースする
 */
function parseGitHubBlobUrl(url: string) {
  const match = url.match(GITHUB_BLOB_RE);
  if (!match) {
    return null;
  }

  const [, owner, repo, refAndPath, startLineStr, endLineStr] = match;
  const startLine = startLineStr
    ? Number.parseInt(startLineStr, 10)
    : undefined;
  const endLine = endLineStr ? Number.parseInt(endLineStr, 10) : undefined;

  // refAndPath からファイル名を抽出
  const pathParts = refAndPath.split('/');
  const filename = pathParts[pathParts.length - 1];

  // 拡張子から言語を判定
  const extMatch = filename.match(/\.(\w+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  const language = EXT_TO_LANG[ext] || ext;

  return { owner, repo, refAndPath, filename, language, startLine, endLine };
}

/**
 * ヘッダーの表示テキストを生成
 */
function buildHeaderText({
  owner,
  repo,
  filename,
  startLine,
  endLine,
}: {
  owner: string;
  repo: string;
  filename: string;
  startLine?: number;
  endLine?: number;
}): string {
  let text = `${owner}/${repo} — ${filename}`;
  if (startLine && endLine) {
    text += `#L${startLine}-L${endLine}`;
  } else if (startLine) {
    text += `#L${startLine}`;
  }
  return text;
}

/** GitHub SVG アイコン */
const gitHubIconSvg: Element = {
  type: 'element',
  tagName: 'svg',
  properties: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'currentColor',
  },
  children: [
    {
      type: 'element',
      tagName: 'path',
      properties: {
        d: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z',
      },
      children: [],
    },
  ],
};

export const gitHubCodeHandler: EmbedHandler = {
  name: 'GitHub',
  match: isGitHubBlobUrl,
  render: async (url) => {
    const parsed = parseGitHubBlobUrl(url);
    if (!parsed) {
      return null;
    }

    const { owner, repo, refAndPath, filename, language, startLine, endLine } =
      parsed;

    // raw.githubusercontent.com からファイルを取得
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${refAndPath}`;
    const response = await fetch(rawUrl, {
      headers: { 'User-Agent': 'sui-blog-build' },
      signal: AbortSignal.timeout(10 * 1000),
    });

    if (!response.ok) {
      return null;
    }

    // ファイルサイズチェック
    const contentLength = response.headers.get('content-length');
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      return null;
    }

    const text = await response.text();
    if (text.length > MAX_FILE_SIZE) {
      return null;
    }

    const allLines = text.split('\n');

    // 行を抽出
    let extractedLines: string[];
    if (startLine && endLine) {
      extractedLines = allLines.slice(startLine - 1, endLine);
    } else if (startLine) {
      extractedLines = allLines.slice(startLine - 1, startLine);
    } else {
      extractedLines = allLines.slice(0, DEFAULT_MAX_LINES);
    }

    // 最大行数で打ち切り
    if (extractedLines.length > MAX_LINES) {
      extractedLines = extractedLines.slice(0, MAX_LINES);
    }

    const code = extractedLines.join('\n');
    const headerText = buildHeaderText({
      owner,
      repo,
      filename,
      startLine,
      endLine,
    });

    // rehypePrettyCode の meta string で行番号を有効化
    // showLineNumbers{N} で開始行番号を指定
    const displayStartLine = startLine ?? 1;
    const meta = `showLineNumbers{${displayStartLine}}`;

    const codeNode: Element & { data?: { meta: string } } = {
      type: 'element',
      tagName: 'code',
      properties: {
        className: language ? [`language-${language}`] : [],
      },
      data: { meta },
      children: [{ type: 'text', value: code }],
    };

    const wrapper: Element = {
      type: 'element',
      tagName: 'div',
      properties: {
        'data-embed-type': 'github',
        className: ['embed-github'],
      },
      children: [
        // ヘッダー
        {
          type: 'element',
          tagName: 'div',
          properties: { className: ['embed-github-header'] },
          children: [
            gitHubIconSvg,
            {
              type: 'element',
              tagName: 'a',
              properties: {
                href: url,
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              children: [{ type: 'text', value: headerText }],
            },
          ],
        },
        // コードブロック（rehypePrettyCode が処理する）
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [codeNode],
        },
      ] as ElementContent[],
    };

    return [wrapper];
  },
};
