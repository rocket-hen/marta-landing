import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		excerpt: z.string(),
		category: z.string(),
		minutes: z.number(),
		pubDate: z.coerce.date(),
	}),
});

export const collections = { blog };
