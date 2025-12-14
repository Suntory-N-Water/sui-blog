/**
 * 目次項目の型定義
 */
export type TOCItem = {
  id: string;
  text: string;
  level: number;
  items?: TOCItem[];
};
