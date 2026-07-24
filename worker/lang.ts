export type SiteLang = 'en' | 'es';

const COOKIE_NAME = 'marta_lang';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCookie(request: Request, name: string): string | undefined {
	const header = request.headers.get('Cookie');
	if (!header) return undefined;
	for (const part of header.split(';')) {
		const eq = part.indexOf('=');
		if (eq === -1) continue;
		if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
	}
	return undefined;
}

function prefersSpanish(request: Request): boolean {
	const acceptLanguage = request.headers.get('Accept-Language') ?? '';
	if (/^\s*es\b/i.test(acceptLanguage)) return true;
	// `cf` is only present on the original edge request, not on internally
	// constructed Request objects — safe to read defensively here.
	const country = (request as Request & { cf?: { country?: string } }).cf?.country;
	return country === 'ES';
}

export function setLangCookie(response: Response, lang: SiteLang): Response {
	const headers = new Headers(response.headers);
	headers.append('Set-Cookie', `${COOKIE_NAME}=${lang}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`);
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// Only meaningful for "/". A stored cookie — regardless of its value — means this
// visitor already made a language choice (auto-detected or via the footer switch),
// so we never override it again; a bare "/" visit always serves English from then on
// and manual switching is entirely up to the footer links.
export function maybeRedirectForLang(request: Request, url: URL): Response | null {
	if (url.pathname !== '/') return null;
	if (getCookie(request, COOKIE_NAME)) return null;
	if (!prefersSpanish(request)) return null;

	const target = new URL('/es/', url);
	return setLangCookie(new Response(null, { status: 302, headers: { Location: target.toString() } }), 'es');
}
