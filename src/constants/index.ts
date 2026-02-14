/**
 * アプリケーション全体で使用される定数を一元管理
 *
 * 各定数は名前空間で分類され、`as const`で型安全性を確保しています。
 * 変更が必要な場合は、このファイルのみを編集してください。
 */

const url =
  import.meta.env.SITE ||
  import.meta.env.PUBLIC_APP_URL ||
  'https://suntory-n-water.com';

/**
 * サイト基本情報
 */
export const SITE_CONSTANTS = {
  /** サイト名 */
  NAME: 'sui Tech Blog',
  /** サイトの説明 */
  DESCRIPTION:
    'スイのテックブログです。トップで最新記事ダイジェストを載せつつ、自己紹介やこれまでの投稿リンク、Web開発の学習記録をまとめています。',
  /** ブログセクションの説明 */
  BLOG_DESCRIPTION: 'Web開発に関する学習記録をまとめたブログです。',
  /** サイトURL */
  URL: url,
  /** OGP画像URL */
  OG_IMAGE: `${url}/opengraph-image.png`,
  /** 著者名 */
  AUTHOR_NAME: 'sui',
  /** 著作権表記 */
  COPYRIGHT: 'Suntory-N-Water',
} as const;

/**
 * ソーシャルメディアリンク
 */
export const SOCIAL_CONSTANTS = {
  /** Twitter/X アカウントURL */
  TWITTER: 'https://x.com/Suntory_N_Water',
  /** Twitter/X ハンドル名 */
  TWITTER_HANDLE: '@Suntory_N_Water',
  /** GitHub アカウントURL */
  GITHUB: 'https://github.com/Suntory-N-Water',
} as const;

/**
 * GitHubリポジトリ情報
 */
export const REPOSITORY_CONSTANTS = {
  /** リポジトリオーナー */
  OWNER: 'Suntory-N-Water',
  /** リポジトリ名 */
  NAME: 'sui-blog',
  /** デフォルトブランチ */
  BRANCH: 'main',
} as const;

/**
 * ブログ設定
 */
export const BLOG_CONSTANTS = {
  /** ブログページのページネーション: 1ページあたりの記事数 */
  POSTS_PER_PAGE: 12,
  /** トップページに表示する記事数 */
  TOP_PAGE_POSTS_COUNT: 3,
  /** 関連記事の表示数 */
  RELATED_POSTS_COUNT: 3,
} as const;

/**
 * Shorts設定
 */
export const SHORTS_CONSTANTS = {
  /** Shortsページのページネーション: 1ページあたりの記事数 */
  POSTS_PER_PAGE: 12,
} as const;

/**
 * 検索機能の設定
 */
export const SEARCH_CONSTANTS = {
  /** 検索結果の最大表示数 */
  MAX_RESULTS: 50,
  /** キーボードショートカット */
  KEYBOARD_SHORTCUT: {
    key: 'k',
    metaKey: true, // Cmd(Mac) / Ctrl(Windows)
  },
} as const;

/**
 * ブログナビゲーション関連の設定
 */
export const BLOG_NAVIGATION_CONSTANTS = {
  /** 最終閲覧したブログ一覧パスを保存する sessionStorage キー */
  LIST_PATH_STORAGE_KEY: 'last-blog-list-path',
  /** ブログ一覧のスクロール位置を保存する sessionStorage キー */
  SCROLL_POSITION_KEY: 'blog-list-scroll-position',
} as const;
