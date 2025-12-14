export type Frontmatter<T> = {
  title: string;
  date: string;
  description: string;
  /** 記事の更新日時(ISO 8601形式、任意) */
  modified_time?: string;
} & T;

export type MarkdownData<T> = {
  metadata: Frontmatter<T>;
  slug: string;
  content?: React.ReactNode;
  rawContent: string;
  filePath: string;
};
