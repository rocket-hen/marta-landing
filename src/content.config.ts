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
		// Cover / og:image, relative to /public — e.g. "/og/blog/my-post.jpg". Falls
		// back to the site default (/og/default.jpg) when a post doesn't have one yet.
		image: z.string().optional(),
		imageAlt: z.string().optional(),
		// Optional 800px-wide companion for the cover <img>'s srcset, so mobile
		// doesn't download the full 1200x630 og:image size. Omit if you haven't
		// generated one — the cover just falls back to the single `image` size.
		imageSmall: z.string().optional(),
		// Rendered as an FAQ accordion + FAQPage JSON-LD when present (see
		// src/components/PostFaq.astro). Omit entirely for posts without one.
		faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
	}),
});

const legal = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/legal' }),
	schema: z.object({
		title: z.string(),
		lastUpdated: z.coerce.date(),
	}),
});

export const collections = { blog, legal };
