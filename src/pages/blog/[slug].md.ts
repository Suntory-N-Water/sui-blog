import type { APIRoute } from 'astro';
import { getEmDashEntry } from 'emdash';
import { asPost } from '../../lib/emdash-types';
import { portableTextToMarkdown } from '../../lib/portable-text-markdown';
import { postDate } from '../../utils/format-date';

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export const GET: APIRoute = async ({ params, redirect }) => {
  const slug = params.slug ?? '';
  const { entry: post } = await getEmDashEntry('posts', slug);
  if (!post) {
    return redirect('/404');
  }
  const normalizedPost = asPost(post);
  const tags = normalizedPost.data.terms?.tag ?? [];
  const publishedAt =
    postDate(normalizedPost.data)?.toISOString().slice(0, 10) ?? '';
  const markdown = `---\ntitle: ${yamlString(normalizedPost.data.title)}\ndescription: ${yamlString(normalizedPost.data.excerpt ?? '')}\ndate: ${publishedAt}\ntags:\n${tags.map((tag) => `  - ${yamlString(tag.label)}`).join('\n')}\n---\n\n${portableTextToMarkdown(normalizedPost.data.content)}`;
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${normalizedPost.id}.md"`,
    },
  });
};
