// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import remarkCallouts from './src/lib/remark-callouts.mjs';
import remarkInlineImages from './src/lib/remark-inline-images.mjs';
import remarkInlineCta from './src/lib/remark-inline-cta.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://callmarta.com',
	integrations: [sitemap()],
	build: {
		// Inline page CSS directly into HTML instead of separate <link rel="stylesheet">
		// requests — those were flagged by PageSpeed as render-blocking on the critical path.
		inlineStylesheets: 'always',
	},
	markdown: {
		// Powers the ":::highlight ... :::" callout block, "::img[...]" inline
		// image markers, and ":::inline-cta{url=... label=...} ... :::" CTA boxes
		// from the content checklist — remarkDirective parses the ":name" syntax,
		// the other three turn directives into real HTML.
		remarkPlugins: [remarkDirective, remarkCallouts, remarkInlineImages, remarkInlineCta],
	},
});
