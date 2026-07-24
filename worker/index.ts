import type { Env } from './env';
import { handleWaitlist } from './waitlist';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === '/api/waitlist') {
			return handleWaitlist(request, env);
		}
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
