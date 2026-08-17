import type { APIRoute } from 'astro';
import { getPostsForLang, postSlug } from '../lib/blog';

export const GET: APIRoute = async () => {
	const [enPosts, esPosts] = await Promise.all([getPostsForLang('en'), getPostsForLang('es')]);

	const enList = enPosts
		.map((p) => `- [${p.data.title}](https://callmarta.com/blog/${postSlug(p)}/): ${p.data.excerpt}`)
		.join('\n');
	const esList = esPosts
		.map((p) => `- [${p.data.title}](https://callmarta.com/es/blog/${postSlug(p)}/): ${p.data.excerpt}`)
		.join('\n');

	const body = `# Marta — AI calling agent for renting in Spain

> Marta calls Spanish landlords and agencies on behalf of tenants (in Spanish),
> confirms listings are still available, and books viewings into the tenant's
> calendar. First report within 24 hours. Built for people renting in Spain,
> including expats who don't speak Spanish.

## Pages
- [Homepage (English)](https://callmarta.com/): how it works, pricing, FAQ, demo call
- [Homepage (Español)](https://callmarta.com/es/): lo mismo, en español
- [How it works](https://callmarta.com/#how): send listings → Marta calls → viewings in your calendar
- [Pricing](https://callmarta.com/#pricing): Blitz €49 (up to 10 listings, 1 month), Marathon €99 (unlimited listings, up to 90 days), Concierge €399 (full service until the contract is signed)
- [Blog (English)](https://callmarta.com/blog/): guides on renting in Spain as a foreigner
- [Blog (Español)](https://callmarta.com/es/blog/): guías sobre alquilar en España

## Blog (English)
${enList}

## Blog (Español)
${esList}
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
