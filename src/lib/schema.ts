import { copy, type Lang } from '../i18n/copy';
import { PLAN_REFS } from './plans';

const SITE_URL = 'https://callmarta.com';

export function organizationSchema(lang: Lang) {
	const m = copy[lang].meta;
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Marta',
		url: SITE_URL,
		description: m.description,
		areaServed: { '@type': 'Country', name: 'Spain' },
		address: { '@type': 'PostalAddress', addressLocality: 'Valencia', addressCountry: 'ES' },
	};
}

export function serviceSchema(lang: Lang) {
	const p = copy[lang].pricing;
	// Only the fixed-price plans become Offers — Scale is priced per
	// conversation with sales, and an Offer without a price is invalid.
	const offers = [
		...p.cols.map((col, i) => {
			const ref = PLAN_REFS[i];
			return {
				'@type': 'Offer',
				name: ref.name,
				price: String(ref.priceEur),
				priceCurrency: 'EUR',
				description: `${col.blurb} ${p.shared.slice(0, 2).join('. ')}.`,
			};
		}),
		{
			'@type': 'Offer',
			name: PLAN_REFS[2].name,
			price: String(PLAN_REFS[2].priceEur),
			priceCurrency: 'EUR',
			description: `${p.concierge.blurb} ${p.concierge.features.slice(0, 3).join('. ')}.`,
		},
	];
	return {
		'@context': 'https://schema.org',
		'@type': 'Service',
		name:
			lang === 'es'
				? 'Marta — servicio de reserva de visitas de pisos en España'
				: 'Marta — apartment viewing booking service in Spain',
		serviceType:
			lang === 'es'
				? 'Asistencia en la búsqueda de alquiler / servicio de llamadas'
				: 'Rental search assistance / calling service',
		provider: { '@type': 'Organization', name: 'Marta', url: SITE_URL },
		areaServed: { '@type': 'Country', name: 'Spain' },
		audience: {
			'@type': 'Audience',
			audienceType: lang === 'es' ? 'Personas que alquilan en España' : 'Expats and foreigners renting in Spain',
		},
		offers,
	};
}

export function faqSchema(faqs: { q: string; a: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	};
}

const PUBLISHER_LOGO_URL = `${SITE_URL}/og/logo.png`;

export function articleSchema(
	lang: Lang,
	post: { title: string; excerpt: string; pubDate: Date; image?: string },
	url: string,
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: post.title,
		description: post.excerpt,
		image: [new URL(post.image ?? '/og/default.jpg', SITE_URL).toString()],
		datePublished: post.pubDate.toISOString(),
		dateModified: post.pubDate.toISOString(),
		author: { '@type': 'Organization', name: 'Marta', url: SITE_URL },
		publisher: {
			'@type': 'Organization',
			name: 'Marta',
			url: SITE_URL,
			logo: { '@type': 'ImageObject', url: PUBLISHER_LOGO_URL, width: 512, height: 512 },
		},
		inLanguage: lang,
		mainEntityOfPage: url,
	};
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			item: item.url,
		})),
	};
}
