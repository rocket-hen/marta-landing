// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import remarkCallouts from './src/lib/remark-callouts.mjs';

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
		// Powers the ":::highlight ... :::" callout block from the content checklist —
		// remarkDirective parses the ":::name" syntax, remarkCallouts turns it into HTML.
		remarkPlugins: [remarkDirective, remarkCallouts],
	},
});
