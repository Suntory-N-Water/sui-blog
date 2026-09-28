import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils';
import chars from '@iconify-json/fluent-emoji-flat/chars.json' with {
  type: 'json',
};
import icons from '@iconify-json/fluent-emoji-flat/icons.json' with {
  type: 'json',
};
import { PROJECT_ROOT } from './lib';

// chars.json のキーは U+FE0F を除いたコードポイントを `-` でつないだ形。
// 同じ絵文字でも入力元によって FE0F の有無が変わるため、除いてから引く
function codepointsOf(emoji: string): string {
  return [...emoji]
    .map((c) => (c.codePointAt(0) ?? 0).toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-');
}

function main() {
  const emoji = process.argv[2];
  if (!emoji) throw new Error('使い方: bun download-icon.ts <絵文字>');

  const name = (chars as Record<string, string>)[codepointsOf(emoji)];
  if (!name)
    throw new Error(
      `${emoji} に対応する Fluent Emoji Flat のアイコンがありません`,
    );

  const iconsDir = join(PROJECT_ROOT, 'public', 'icons');
  const base = name.replaceAll('-', '_');
  // 旧スクリプトは肌の色に対応した絵文字を `_flat_default.svg` で保存していた。
  // 本番メディアはファイル名で引くため、既存のものがあれば使い回す
  const existing = [`${base}_flat.svg`, `${base}_flat_default.svg`].find((f) =>
    existsSync(join(iconsDir, f)),
  );
  if (existing) {
    console.log(
      JSON.stringify(
        { downloaded: false, icon_url: `/icons/${existing}` },
        null,
        2,
      ),
    );
    return;
  }

  const data = getIconData(icons as Parameters<typeof getIconData>[0], name);
  if (!data) throw new Error(`${name} のアイコンデータがありません`);
  const { attributes, body } = iconToSVG(data, { height: 'auto' });
  const filename = `${base}_flat.svg`;
  mkdirSync(iconsDir, { recursive: true });
  writeFileSync(join(iconsDir, filename), `${iconToHTML(body, attributes)}\n`);
  console.log(
    JSON.stringify(
      { downloaded: true, icon_url: `/icons/${filename}` },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
