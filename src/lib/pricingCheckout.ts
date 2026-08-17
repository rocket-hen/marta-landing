export interface Tier {
	name: 'Blitz' | 'Marathon' | 'Concierge';
	tagline: string;
	/** Static caption under the FastSpring-rendered price — billing timing, not the amount itself. */
	term: string;
	features: string[];
	productPath: string;
	ctaLabel: string;
}

// FastSpring product paths — created in the live FastSpring catalog to match the flat-fee
// tiers described on the homepage pricing section (src/components/Pricing.astro). Every
// tier is a one-time product (Catalog → One-Time Products) — this business has no subscriptions.
export const PRICING_TIERS: Tier[] = [
	{
		name: 'Blitz',
		tagline: 'You found the listings. Marta gets you inside.',
		term: 'One-time fee — active for 1 month',
		features: [
			'Up to 10 listings — send them one by one, or drop a whole file',
			'Calls in Spanish within hours, retrying until someone picks up',
			'Full report on every listing: available or gone, recording and transcript of every call',
			"Viewing confirmations on WhatsApp — for you and for the agency, with each other's contacts",
			'We present you as a reliable tenant (nómina, insurance, pets)',
			'A real person steps in when a call needs one',
			'Money-back guarantee',
		],
		productPath: 'blitz',
		ctaLabel: 'Buy Blitz',
	},
	{
		name: 'Marathon',
		tagline: 'The whole hunt, until you move in.',
		term: 'One-time fee — active until you find your home, up to 90 days',
		features: [
			'Everything in Blitz',
			'Unlimited listings — send them as you find them, every day',
			"Runs until you've found your home — up to 90 days",
		],
		// The FastSpring catalog still knows this product by its original slug;
		// renaming the path there would break existing checkout links.
		productPath: 'hunter',
		ctaLabel: 'Buy Marathon',
	},
	{
		name: 'Concierge',
		tagline: 'A human by your side until the contract is signed.',
		term: 'One-time fee — charged once you sign a contract',
		features: [
			'Everything in Marathon',
			'Personal manager, priority queue',
			'Price negotiation on your behalf',
			'Help with documents & requisitos',
			'Scam check on every listing',
			'Support until you sign',
		],
		productPath: 'concierge',
		ctaLabel: 'Buy Concierge',
	},
];
