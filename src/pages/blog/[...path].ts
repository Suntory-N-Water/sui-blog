import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url, redirect }) =>
  redirect(`${url.pathname.replace(/^\/blog/u, '/posts')}${url.search}`, 301);
