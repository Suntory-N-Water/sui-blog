import { BLOG_CONSTANTS } from '@/constants';
import type { BlogPost } from '@/lib/markdown';

/**
 * TF-IDF + Cosine Similarityを使用した関連記事レコメンデーション
 */

/**
 * 配列の合計を計算する
 */
function sum(arr: number[]): number {
  return arr.reduce((acc, val) => acc + val, 0);
}

/**
 * ベクトルのL2ノルムを計算する
 */
function norm(vector: number[]): number {
  return Math.sqrt(sum(vector.map((v) => v * v)));
}

/**
 * 2つのベクトルの内積を計算する
 */
function innerProduct({ va, vb }: { va: number[]; vb: number[] }): number {
  if (va.length !== vb.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  return sum(va.map((_, idx) => va[idx] * vb[idx]));
}

/**
 * Cosine Similarityを計算する
 */
function cosineSimilarity({ va, vb }: { va: number[]; vb: number[] }): number {
  const normA = norm(va);
  const normB = norm(vb);

  // ゼロベクトルの場合は類似度0を返す
  if (normA === 0 || normB === 0) {
    return 0;
  }

  return innerProduct({ va, vb }) / (normA * normB);
}

/**
 * ベクトルをL2正規化する
 */
function normalizeL2(vector: number[]): number[] {
  const vectorNorm = norm(vector);
  if (vectorNorm === 0) {
    return vector;
  }
  return vector.map((v) => v / vectorNorm);
}

/**
 * TF-IDFベクトルを計算する
 */
function calculateTfIdfVectors(posts: BlogPost[]): Map<string, number[]> {
  const N = posts.length;

  // 各記事のタグを取得(タグがない場合は空配列)
  const documents = posts.map((post) => ({
    slug: post.slug,
    tags: post.metadata.tags ?? [],
  }));

  // IDF計算: 各タグが何個の記事に出現するかをカウント
  const tagToDocumentFrequency: Map<string, number> = new Map();
  for (const doc of documents) {
    const uniqueTags = [...new Set(doc.tags)];
    for (const tag of uniqueTags) {
      tagToDocumentFrequency.set(
        tag,
        (tagToDocumentFrequency.get(tag) ?? 0) + 1,
      );
    }
  }

  // 語彙(全タグ)をソート
  const vocab = Array.from(tagToDocumentFrequency.keys()).sort();
  const tagToIdx = new Map(vocab.map((tag, idx) => [tag, idx]));

  // IDFを計算
  const tagToIdf: Map<string, number> = new Map();
  for (const tag of vocab) {
    const df = tagToDocumentFrequency.get(tag) ?? 0;
    const idf = Math.log((N + 1) / (df + 1)) + 1;
    tagToIdf.set(tag, idf);
  }

  // TF-IDFベクトルを計算
  const tfIdfVectors: number[][] = documents.map(() =>
    Array(vocab.length).fill(0),
  );

  for (let i = 0; i < N; i++) {
    const doc = documents[i];
    for (const tag of doc.tags) {
      const vocabIdx = tagToIdx.get(tag);
      if (vocabIdx !== undefined) {
        tfIdfVectors[i][vocabIdx] += 1;
      }
    }
  }

  // TF-IDFスコアを計算(TF * IDF)
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < vocab.length; j++) {
      const tag = vocab[j];
      const idf = tagToIdf.get(tag) ?? 0;
      tfIdfVectors[i][j] *= idf;
    }
  }

  // L2正規化
  const normalizedVectors = tfIdfVectors.map((vector) => normalizeL2(vector));

  // slugをキーとしたMapを作成
  const slugToVector = new Map<string, number[]>();
  for (let i = 0; i < N; i++) {
    slugToVector.set(documents[i].slug, normalizedVectors[i]);
  }

  return slugToVector;
}

/**
 * 関連記事の情報
 */
export type RelatedPost = {
  post: BlogPost;
  similarity: number;
};

/**
 * 指定された記事の関連記事を取得する
 *
 * @param currentSlug - 現在の記事のslug
 * @param allPosts - 全記事の配列
 * @param count - 取得する関連記事の数(デフォルト: 4)
 * @returns 関連記事の配列(類似度降順)
 */
export function getRelatedPosts({
  currentSlug,
  allPosts,
  count = BLOG_CONSTANTS.RELATED_POSTS_COUNT,
}: {
  currentSlug: string;
  allPosts: BlogPost[];
  count?: number;
}): RelatedPost[] {
  // TF-IDFベクトルを計算
  const slugToVector = calculateTfIdfVectors(allPosts);

  // 現在の記事のベクトルを取得
  const currentVector = slugToVector.get(currentSlug);
  if (!currentVector) {
    return [];
  }

  // 他の記事との類似度を計算
  const similarities: RelatedPost[] = [];
  for (const post of allPosts) {
    // 自分自身は除外
    if (post.slug === currentSlug) {
      continue;
    }

    const postVector = slugToVector.get(post.slug);
    if (!postVector) {
      continue;
    }

    const similarity = cosineSimilarity({ va: currentVector, vb: postVector });
    similarities.push({ post, similarity });
  }

  // 類似度でソート(降順)して上位N件を返す
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);
}
