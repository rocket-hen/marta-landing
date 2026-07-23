import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: 'Marta — Blog',
		description: 'Practical notes from thousands of calls with Spanish agencies and landlords.',
		site: context.site,
		items: posts
			.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
			.map((post) => ({
				title: post.data.title,
				description: post.data.excerpt,
				pubDate: post.data.pubDate,
				link: `/blog/${post.id}/`,
			})),
	});
}
