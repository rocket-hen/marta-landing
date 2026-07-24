// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://callmarta.com',
	integrations: [sitemap()],
	build: {
		// Inline page CSS directly into HTML instead of separate <link rel="stylesheet">
		// requests — those were flagged by PageSpeed as render-blocking on the critical path.
		inlineStylesheets: 'always',
	},
});
