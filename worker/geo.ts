function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

// Cloudflare's `cf` object is only present on the original edge request, not on
// internally constructed Request objects — same defensive cast used in lang.ts.
export function handleGeo(request: Request): Response {
	const country = (request as Request & { cf?: { country?: string } }).cf?.country;
	return json({ country: country ?? null });
}
