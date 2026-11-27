import type { APIRoute, GetStaticPaths } from 'astro';
import { markdownResponse, postMarkdown } from '../../lib/agent-markdown';
import { getPosts, type Post } from '../../lib/posts';
import { siteOrigin } from '../../lib/site';

export const getStaticPaths = (async () =>
  (await getPosts()).map((post) => ({
    params: { slug: post.id },
    props: { post },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = ({ site, props }) =>
  markdownResponse(postMarkdown(siteOrigin(site), props.post));
