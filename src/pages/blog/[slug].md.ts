import type { APIRoute } from 'astro';
import { getEmDashEntry } from 'emdash';
import { asBlog } from '../../lib/emdash-types';
import { portableTextToMarkdown } from '../../lib/portable-text-markdown';
import { blogDate } from '../../utils/format-date';

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export const GET: APIRoute = async ({ params, redirect }) => {
  const slug = params.slug ?? '';
  const { entry: blog } = await getEmDashEntry('blogs', slug);
  if (!blog) {
    return redirect('/404');
  }
  const normalizedBlog = asBlog(blog);
  const tags = normalizedBlog.data.terms?.tag ?? [];
  const publishedAt =
    blogDate(normalizedBlog.data)?.toISOString().slice(0, 10) ?? '';
  const markdown = `---\ntitle: ${yamlString(normalizedBlog.data.title)}\ndescription: ${yamlString(normalizedBlog.data.excerpt ?? '')}\ndate: ${publishedAt}\ntags:\n${tags.map((tag) => `  - ${yamlString(tag.label)}`).join('\n')}\n---\n\n${portableTextToMarkdown(normalizedBlog.data.content)}`;
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${normalizedBlog.id}.md"`,
    },
  });
};
