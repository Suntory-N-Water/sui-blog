import type { APIRoute, GetStaticPaths } from 'astro';
import { iconDataUrl } from '../../../lib/icons';
import { renderOgpImage } from '../../../lib/ogp';
import { getPosts, type Post, postTags } from '../../../lib/posts';

export const getStaticPaths = (async () =>
  (await getPosts()).map((post) => ({
    params: { slug: post.id },
    props: { post },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = async ({ props: { post } }) => {
  const image = await renderOgpImage({
    title: post.data.title,
    tags: postTags(post).map((tag) => tag.label),
    iconDataUrl: iconDataUrl(post.data.icon_url),
  });
  return new Response(image as Uint8Array<ArrayBuffer>, {
    headers: { 'Content-Type': 'image/png' },
  });
};
