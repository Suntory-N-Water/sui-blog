import { Resvg } from '@cf-wasm/resvg';
import type { APIRoute } from 'astro';
import { getEmDashEntry } from 'emdash';
import { asPost } from '../../../lib/emdash-types';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function lines({ value, max }: { value: string; max: number }): string[] {
  const result: string[] = [];
  for (let index = 0; index < value.length; index += max) {
    result.push(value.slice(index, index + max));
  }
  return result.length ? result : [''];
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';
  const { entry: post } = await getEmDashEntry('posts', slug);
  if (!post) {
    return new Response('Not found', { status: 404 });
  }
  const normalizedPost = asPost(post);
  const title = lines({ value: normalizedPost.data.title, max: 24 }).slice(
    0,
    3,
  );
  const excerpt = lines({
    value: normalizedPost.data.excerpt ?? '',
    max: 52,
  }).slice(0, 2);
  const titleSvg = title
    .map(
      (line, index) =>
        `<text x="90" y="${215 + index * 72}" fill="#202124" font-size="58" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join('');
  const excerptSvg = excerpt
    .map(
      (line, index) =>
        `<text x="94" y="${440 + index * 32}" fill="#5f6368" font-size="24">${escapeXml(line)}</text>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f8fafc"/><rect x="54" y="54" width="1092" height="522" rx="28" fill="#ffffff" stroke="#d9e2ec" stroke-width="3"/><rect x="90" y="100" width="96" height="10" rx="5" fill="#1464c0"/><text x="90" y="155" fill="#1464c0" font-size="26" font-weight="600">sui Tech Blog</text>${titleSvg}${excerptSvg}<text x="90" y="540" fill="#8a94a6" font-size="20">${escapeXml(normalizedPost.id)}</text></svg>`;
  const png = (await Resvg.async(svg)).render().asPng();
  return new Response(png as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
