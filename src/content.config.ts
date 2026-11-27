import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './contents/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    modified_time: z.coerce.date().optional(),
    description: z.string().default(''),
    icon: z.string().optional(),
    icon_url: z
      .string()
      .regex(/^\/icons\/[\w-]+\.svg$/u)
      .optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { posts };
