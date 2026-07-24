import rss from '@astrojs/rss';
import { getPostsForLang, postSlug } from '../../lib/blog';

export async function GET(context) {
	const posts = await getPostsForLang('es');
	return rss({
		title: 'Marta — Blog',
		description: 'Notas prácticas de miles de llamadas con agencias y propietarios en España.',
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.excerpt,
			pubDate: post.data.pubDate,
			link: `/es/blog/${postSlug(post)}/`,
		})),
	});
}
