import { slug } from 'github-slugger';
import type { TOCItem } from '@/types/toc';

/**
 * MarkdownからH2とH3の見出しを抽出して階層的な目次を生成する
 *
 * @param content - Markdownの生のコンテンツ
 * @returns 目次項目の配列(H2の下にH3がネストされる)
 */
export function extractTOC(content: string): TOCItem[] {
  // 改行でコンテンツを分割
  const lines = content.split('\n');

  const result: TOCItem[] = [];
  let currentH2: TOCItem | null = null;
  let inCodeBlock = false;
  let codeBlockFenceLength = 0;

  // 各行を走査
  for (const line of lines) {
    const trimmedLine = line.trim();

    // コードブロックの開始・終了を検出(```または````で始まる行)
    const fenceMatch = trimmedLine.match(/^(`{3,})(?:\s*(\S+)?.*)?$/);
    if (fenceMatch) {
      const currentFenceLength = fenceMatch[1].length;
      const language = fenceMatch[2]; // 言語指定(あれば)

      if (!inCodeBlock) {
        // コードブロック開始(言語指定があってもなくてもOK)
        inCodeBlock = true;
        codeBlockFenceLength = currentFenceLength;
      } else if (currentFenceLength >= codeBlockFenceLength && !language) {
        // コードブロック終了の条件：
        // 1. 同じ長さ以上のフェンス
        // 2. 言語指定がない(バッククォートのみ)
        inCodeBlock = false;
        codeBlockFenceLength = 0;
      }
      continue;
    }

    // コードブロック内の行はスキップ
    if (inCodeBlock) {
      continue;
    }

    // ## から始まる行はh2要素
    if (line.startsWith('## ')) {
      const rawText = line.replace('## ', '').trim();
      // Markdownフォーマット(太字、イタリック、コードなど)を除去して表示用テキストを生成
      const text = stripMarkdownFormatting(rawText);
      // 見出しをIDとして使用(元のテキストから生成)
      const id = generateSlug(rawText);

      currentH2 = {
        id,
        text,
        level: 2,
        items: [],
      };
      result.push(currentH2);
    }
    // ### から始まる行はh3要素
    else if (line.startsWith('### ')) {
      const rawText = line.replace('### ', '').trim();
      // Markdownフォーマット(太字、イタリック、コードなど)を除去して表示用テキストを生成
      const text = stripMarkdownFormatting(rawText);
      // 見出しをIDとして使用(元のテキストから生成)
      const id = generateSlug(rawText);

      const h3Item: TOCItem = {
        id,
        text,
        level: 3,
      };

      // 現在のH2配下に追加
      if (currentH2) {
        currentH2.items = currentH2.items || [];
        currentH2.items.push(h3Item);
      }
    }
  }

  return result;
}

/**
 * Markdownフォーマット記号を除去してプレーンテキストを取得
 * 太字(**、__)、イタリック(*、_)、コード(`)などを除去
 *
 * @param text - Markdownフォーマットを含むテキスト
 * @returns プレーンテキスト
 */
function stripMarkdownFormatting(text: string): string {
  return (
    text
      // 太字とイタリックの組み合わせ(***text*** or ___text___)
      .replace(/(\*\*\*|___)(.+?)\1/g, '$2')
      // 太字(**text** or __text__)
      .replace(/(\*\*|__)(.+?)\1/g, '$2')
      // イタリック(*text* or _text_)
      .replace(/(\*|_)(.+?)\1/g, '$2')
      // インラインコード(`text`)
      .replace(/`([^`]+)`/g, '$1')
      // リンク([text](url))
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 画像(![alt](url))
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .trim()
  );
}

/**
 * テキストからURLスラッグを生成
 * rehype-slugと同じgithub-sluggerライブラリを使用して、
 * HTMLの見出しIDと目次のIDを完全に一致させる
 *
 * @param text - スラッグ化するテキスト
 * @returns URL用のスラッグ文字列
 */
function generateSlug(text: string): string {
  // Markdownフォーマットを除去
  const plainText = stripMarkdownFormatting(text);

  // 空文字列の場合はランダムなIDを返す(重複防止)
  if (!plainText.trim()) {
    return `toc-${Math.random().toString(36).substring(2, 9)}`;
  }

  // github-sluggerを使用してrehype-slugと同じID生成ロジックを適用
  return slug(plainText);
}
