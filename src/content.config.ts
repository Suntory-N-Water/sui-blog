import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DiagramSectionSchema } from './types/diagram-schemas';

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './contents/blog',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    modified_time: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    icon: z.string().optional(),
    icon_url: z.string().optional(),
    selfAssessment: z
      .object({
        quizzes: z.array(
          z.object({
            question: z.string(),
            answers: z.array(
              z.object({
                text: z.string(),
                correct: z.boolean(),
                explanation: z.string().nullable(),
              }),
            ),
          }),
        ),
      })
      .optional(),
    diagram: z.array(DiagramSectionSchema).optional(),
  }),
});

const shorts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './contents/shorts',
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

const works = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './contents/works',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string(),
    siteUrl: z.url(),
    githubUrl: z.url(),
  }),
});

export const collections = { blog, shorts, works };
