import type { Element, ElementContent } from 'hast';

/** rehype-stringify が allowDangerousHtml: true で処理する raw ノード */
export type RawNode = {
  type: 'raw';
  value: string;
};

export type EmbedNode = Element | ElementContent | RawNode;

/**
 * リッチ埋め込みハンドラの共通インターフェース
 */
export type EmbedHandler = {
  /** サービス名（ログ出力用） */
  name: string;
  /** URLがこのハンドラの対象かどうかを判定する */
  match: (url: string) => boolean;
  /** URLからHASTノードを生成する。nullを返すとリンクカードにフォールバック */
  render: (url: string) => Promise<EmbedNode[] | null>;
};
