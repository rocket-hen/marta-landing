import type { Env } from './env';
import { handleWaitlist } from './waitlist';
import { maybeRedirectForLang, setLangCookie } from './lang';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname === '/api/waitlist') {
			return handleWaitlist(request, env);
		}

		if (url.pathname === '/' || url.pathname === '/es/') {
			const redirect = maybeRedirectForLang(request, url);
			if (redirect) return redirect;
			const res = await env.ASSETS.fetch(request);
			return setLangCookie(res, url.pathname === '/es/' ? 'es' : 'en');
		}

		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
