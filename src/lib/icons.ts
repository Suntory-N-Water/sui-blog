import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const UNSAFE_SVG = [
  /<script/iu,
  /<foreignObject/iu,
  /<iframe/iu,
  /\son[a-z]+\s*=/iu,
  /javascript:/iu,
  /<!ENTITY/iu,
  /(?:href|src)\s*=\s*["']?\s*(?:https?:|data:)/iu,
];

const cache = new Map<string, string>();

function loadIcon(iconUrl: string): string {
  const filename = iconUrl.replace(/^\/icons\//u, '');
  if (!/^[\w-]+\.svg$/u.test(filename)) {
    throw new Error(`アイコンのパス「${iconUrl}」は /icons/<名前>.svg の形にしてください。`);
  }
  const svg = readFileSync(join(process.cwd(), 'public', 'icons', filename), 'utf8').trim();
  if (!svg.startsWith('<svg') || UNSAFE_SVG.some((pattern) => pattern.test(svg))) {
    throw new Error(
      `アイコン「${filename}」に、スクリプト、イベント属性、外部参照のいずれかが含まれています。`,
    );
  }
  return svg.replace(/^<svg\b([^>]*)>/u, (_, attributes: string) => {
    const kept = attributes.replace(/\s(?:width|height|class|aria-hidden|focusable)="[^"]*"/gu, '');
    return `<svg${kept} aria-hidden="true" focusable="false">`;
  });
}

export function inlineIcon(iconUrl: string | undefined): string | undefined {
  if (!iconUrl) {
    return undefined;
  }
  let svg = cache.get(iconUrl);
  if (svg === undefined) {
    svg = loadIcon(iconUrl);
    cache.set(iconUrl, svg);
  }
  return svg;
}

export function iconDataUrl(iconUrl: string | undefined): string | undefined {
  const svg = inlineIcon(iconUrl);
  return svg ? `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` : undefined;
}
