import fs from 'node:fs';
import path from 'node:path';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Node.js環境でDOMPurifyを初期化
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * SVGをサニタイズしてXSS攻撃を防ぐ
 * script要素、onload/onerror等のイベントハンドラを除去
 */
function sanitizeSVG(svg: string): string {
  return purify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: [
      'svg',
      'path',
      'circle',
      'rect',
      'line',
      'polyline',
      'polygon',
      'g',
      'defs',
      'use',
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/**
 * public/icons 配下の SVG を読み込み、パスをキーにインライン用の文字列を返す。
 * ビルド時に一度だけ同期読み込みし、ランタイムではメモリキャッシュを参照する。
 * セキュリティ: すべてのSVGはDOMPurifyでサニタイズされる
 */
function loadIcons(): Record<string, string> {
  const iconsDir = path.join(process.cwd(), '..', 'public', 'icons');
  const cache: Record<string, string> = {};

  if (!fs.existsSync(iconsDir)) {
    return cache;
  }

  for (const file of fs.readdirSync(iconsDir)) {
    if (!file.endsWith('.svg')) {
      continue;
    }
    const abs = path.join(iconsDir, file);
    try {
      const svg = fs.readFileSync(abs, 'utf8');
      // セキュリティ: XSS攻撃を防ぐためSVGをサニタイズ
      cache[`/icons/${file}`] = sanitizeSVG(svg);
    } catch {
      // 読み込み失敗時はスキップ
    }
  }

  return cache;
}

const iconCache = loadIcons();

/**
 * `/icons/foo.svg` のようなパスからインラインSVG文字列を取得する
 */
export function getInlineIcon(pathname: string): string | undefined {
  return iconCache[pathname];
}
