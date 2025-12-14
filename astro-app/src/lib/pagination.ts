/**
 * ページネーション結果の型定義
 *
 * @template T - ページネーション対象のアイテムの型
 */
export type PaginationResult<T> = {
  /** ページ内のアイテム配列 */
  items: T[];
  /** 現在のページ番号(1始まり) */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 全アイテムの総数 */
  totalItems: number;
};

/**
 * アイテムの配列をページネーションする汎用関数
 *
 * 与えられたアイテム配列を指定されたページサイズで分割し、
 * 指定されたページのアイテムとメタデータを返します。
 * ページ番号が範囲外の場合は、自動的に有効な範囲内に調整されます。
 *
 * @template T - ページネーション対象のアイテムの型
 * @param params - ページネーションのパラメータ
 * @param params.items - ページネーション対象のアイテム配列
 * @param params.page - 取得するページ番号(1始まり)
 * @param params.pageSize - 1ページあたりのアイテム数
 * @returns ページネーション結果(アイテム、現在ページ、総ページ数、総アイテム数)
 */
export function paginateItems<T>({
  items,
  page,
  pageSize,
}: {
  items: T[];
  page: number;
  pageSize: number;
}): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    currentPage,
    totalPages,
    totalItems,
  };
}
