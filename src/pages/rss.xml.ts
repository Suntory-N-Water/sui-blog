import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { siteConfig } from '@/config/site';
import { getAllBlogPosts } from '@/lib/markdown';

export async function GET(context: APIContext) {
  const posts = await getAllBlogPosts();

  return rss({
    title: siteConfig.name,
    description: siteConfig.blogDescription,
    site: context.site ?? siteConfig.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description || '',
      link: `/blog/${post.id}/`,
      pubDate: new Date(post.data.date),
      categories: post.data.tags || [],
    })),
    customData: `<language>ja</language>`,
    stylesheet: false,
  });
}
