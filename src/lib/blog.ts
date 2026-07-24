import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/copy';

// Spanish posts live under src/content/blog/es/, giving them an "es/"-prefixed
// collection id — that prefix is the only thing that distinguishes the two
// language's posts, since they're independently written, not 1:1 translations.
export async function getPostsForLang(lang: Lang): Promise<CollectionEntry<'blog'>[]> {
	const all = await getCollection('blog');
	return all
		.filter((post) => (lang === 'es' ? post.id.startsWith('es/') : !post.id.startsWith('es/')))
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function postSlug(post: CollectionEntry<'blog'>): string {
	return post.id.replace(/^es\//, '');
}
