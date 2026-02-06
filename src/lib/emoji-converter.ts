import emojiData from 'unicode-emoji-json';

/**
 * 絵文字の情報を表す型
 *
 * unicode-emoji-jsonパッケージが提供する絵文字メタデータの構造を定義します。
 */
type Emoji = {
  /** 絵文字の名前(例: "fire", "smiling face with halo") */
  name: string;
  /** 絵文字のslug(例: "fire", "smiling_face_with_halo") */
  slug: string;
  /** 絵文字のグループ(例: "Smileys & Emotion") */
  group: string;
  /** 絵文字が追加されたEmoji仕様バージョン */
  emoji_version: string;
  /** Unicodeバージョン */
  unicode_version: string;
  /** 肌色のバリエーションをサポートするかどうか */
  skin_tone_support: boolean;
};

/**
 * FluentUI Emojiの生成パラメータ
 */
type FluentEmojiParams = {
  /** 絵文字情報 */
  emojiInfo: Emoji;
};

/**
 * 絵文字からFluentUI EmojiのURLを生成する
 *
 * Microsoft FluentUI Emojiのアセットは、GitHubのCDNでホストされています。
 * この関数は絵文字のメタデータからアセットのURLを生成します。
 *
 * URLの構造:
 * - 肌色サポートなし: `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/{DirName}/Flat/{slug}_flat.svg`
 * - 肌色サポートあり: `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/{DirName}/Default/Flat/{slug}_flat_default.svg`
 *
 * @param params - FluentUI Emojiの生成パラメータ
 * @returns FluentUI EmojiのURL
 */
async function generateFluentEmojiUrl({
  emojiInfo,
}: FluentEmojiParams): Promise<string> {
  const { name, slug, skin_tone_support } = emojiInfo;

  // ディレクトリ名: nameを最初の文字だけ大文字にして、残りは小文字
  // 例: "woman gesturing OK" → "Woman gesturing ok"
  const dirName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  const encodedDirName = dirName.replace(/ /g, '%20');

  const basePath =
    'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets';
  const flatPath = skin_tone_support ? 'Default/Flat' : 'Flat';
  const suffix = skin_tone_support
    ? `${slug}_flat_default.svg`
    : `${slug}_flat.svg`;

  // URLを生成
  const url = `${basePath}/${encodedDirName}/${flatPath}/${suffix}`;

  // URLが有効か確認
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      return url;
    }
  } catch {
    // fetch失敗時はそのまま返す
  }

  // 404の場合でもURLを返す(エラーログ用)
  return url;
}

/**
 * 絵文字を正規化する
 *
 * 異体字セレクタ(Variation Selector-16: U+FE0F)を削除して、
 * ライブラリに登録されている形式に統一します。
 *
 * MacOSなどのOSでは絵文字に自動的にU+FE0Fが付加されることがありますが、
 * unicode-emoji-jsonライブラリには基本形(U+FE0Fなし)で登録されているため、
 * この正規化処理が必要です。
 *
 * @param emoji - 正規化する絵文字文字列
 * @returns 正規化された絵文字文字列
 */
function normalizeEmoji(emoji: string): string {
  // Variation Selector-16 (U+FE0F) を削除
  return emoji.replace(/\uFE0F/g, '');
}

/**
 * 絵文字をFluentUI EmojiのURLに変換する
 *
 * この関数は絵文字文字列を受け取り、対応するFluentUI EmojiのURLを返します。
 * 絵文字データが見つからない場合や、変換できない場合は元の文字列をそのまま返します。
 *
 * @param icon - 変換する絵文字文字列(例: "🔥", "😎")
 * @returns FluentUI EmojiのURL、または変換できない場合は元の文字列
 */
export async function convertEmojiToFluentUrl({
  icon,
}: {
  icon: string;
}): Promise<string> {
  // 絵文字を正規化(異体字セレクタを削除)
  const normalizedIcon = normalizeEmoji(icon);

  // 絵文字データからメタデータを取得
  const emojiInfo = emojiData[normalizedIcon as keyof typeof emojiData];

  // 絵文字データが見つからない場合は元の文字列を返す
  if (!emojiInfo) {
    return icon;
  }

  // FluentUI EmojiのURLを生成
  return await generateFluentEmojiUrl({ emojiInfo });
}
