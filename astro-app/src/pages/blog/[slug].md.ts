import type { APIContext } from 'astro';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/markdown';

export async function getStaticPaths() {
  const allPosts = await getAllBlogPosts();
  return allPosts.map((post) => ({
    params: { slug: post.slug },
  }));
}

export async function GET({ params }: APIContext) {
  const { slug } = params;

  if (!slug) {
    return;
  }

  // slugから`.md`を削除してブログ検索する
  const post = await getBlogPostBySlug(slug.replace('.md', ''));
  if (!post) {
    return new Response('Not found', { status: 404 });
  }

  const body = `# ${post.metadata.title}

  ${post.rawContent}
    `;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
