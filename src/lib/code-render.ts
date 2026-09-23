import { bundledLanguagesInfo } from 'shiki/langs';
import { renderCacheKey } from './render-cache';

const RENDER_VERSION = 'v1';
export const CODE_THEME = 'dark-plus';
export const RENDER_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

const SUPPORTED_LANGUAGES = new Set([
  'plaintext',
  'plain',
  'text',
  'txt',
  'ansi',
  ...bundledLanguagesInfo.flatMap((info) => [info.id, ...(info.aliases ?? [])]),
]);

type CodeNode = {
  _type?: string;
  code?: string;
  language?: string;
};

export function codeLanguage(language: string | undefined): string {
  const lower = language?.toLowerCase();
  return lower && SUPPORTED_LANGUAGES.has(lower) ? lower : 'plaintext';
}

export function isMermaid(language: string | undefined): boolean {
  return language?.toLowerCase() === 'mermaid';
}

export function codeCacheKey(code: string, lang: string): Promise<string> {
  return renderCacheKey('code', RENDER_VERSION, CODE_THEME, lang, code);
}

export function mermaidCacheKey(code: string): Promise<string> {
  return renderCacheKey('mermaid', RENDER_VERSION, code);
}

export async function codeRenderCacheKeys(blocks: unknown): Promise<string[]> {
  if (!Array.isArray(blocks)) {
    return [];
  }

  const keys: Promise<string>[] = [];
  for (const block of blocks as CodeNode[]) {
    if (block?._type !== 'code' || !block.code) {
      continue;
    }
    keys.push(
      isMermaid(block.language)
        ? mermaidCacheKey(block.code)
        : codeCacheKey(block.code, codeLanguage(block.language)),
    );
  }
  return Promise.all(keys);
}
