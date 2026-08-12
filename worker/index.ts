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
			const withLang = setLangCookie(res, url.pathname === '/es/' ? 'es' : 'en');
			// Points agents at llms.txt for a machine-readable summary of the site
			// (RFC 8288 Link header, checked by AI-agent-readiness audits).
			withLang.headers.append('Link', '</llms.txt>; rel="alternate"; type="text/markdown"');
			return withLang;
		}

		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
