import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:    z.string(),
    excerpt:  z.string(),
    author:   z.string(),
    date:     z.string(),
    tag:      z.string(),
    accent:   z.string().default('#226d0b'),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };