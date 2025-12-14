import { siteConfig } from '@/config/site';
import type { BlogPost } from '@/lib/markdown';
import { getAllBlogPosts } from '@/lib/markdown';

/**
 * llms.txt の内容を生成する関数
 *
 * @param posts - ブログ記事の配列
 * @returns llms.txt形式のMarkdown文字列
 */
function renderLlmsTxt(posts: BlogPost[]): string {
  return `# ${siteConfig.name}

> ${siteConfig.description}

${
  posts.length > 0
    ? `## ブログ記事

${posts
  .map(
    (post) =>
      `- [${post.metadata.title}](${siteConfig.url}/blog/${post.slug}.md): ${post.metadata.description || ''}`,
  )
  .join('\n')}
`
    : ''
}
`;
}

export async function GET() {
  const posts = await getAllBlogPosts();
  const markdownContent = renderLlmsTxt(posts);

  return new Response(markdownContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
