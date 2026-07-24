// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://callmarta.com',
	build: {
		// Inline page CSS directly into HTML instead of separate <link rel="stylesheet">
		// requests — those were flagged by PageSpeed as render-blocking on the critical path.
		inlineStylesheets: 'always',
	},
});
