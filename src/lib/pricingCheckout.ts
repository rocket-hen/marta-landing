export interface Tier {
	name: 'Blitz' | 'Marathon' | 'Concierge';
	tagline: string;
	/** Static caption under the price — billing timing, not the amount itself. */
	term: string;
	features: string[];
	/** Fixed display price. Stripe has no PricePreview-style directive — we're not
	 *  running automatic_tax (no active Stripe Tax registration yet), so this is the
	 *  literal, final amount, not a placeholder for a localized/computed one. */
	priceDisplay: string;
	productPath: string;
	ctaLabel: string;
}

// Stripe product paths — match the `lookup_key` set on each Price in the Stripe catalog
// (Products → one-time Prices) and the productPath the client sends to
// POST /api/create-checkout-session. Every tier is a one-time Price — this business has
// no subscriptions.
export const PRICING_TIERS: Tier[] = [
	{
		name: 'Blitz',
		priceDisplay: '€49',
		tagline: 'You found the listings. Marta gets you inside.',
		term: 'One-time fee — for 15 results',
		features: [
			'Send listings one by one, or drop a whole file',
			'Calls in Spanish within hours, retrying until someone picks up',
			'Full report on every listing: available or gone, recording and transcript of every call',
			"Viewing confirmations on WhatsApp — for you and for the agency, with each other's contacts",
			'We present you as a reliable tenant (nómina, insurance, pets)',
			'Money-back guarantee',
		],
		productPath: 'blitz',
		ctaLabel: 'Buy Blitz',
	},
	{
		name: 'Marathon',
		priceDisplay: '€99',
		tagline: 'The whole hunt, until you move in.',
		term: 'One-time fee — for 100 results',
		features: [
			'Everything in Blitz',
			'Send listings as you find them, every day',
			'A real person steps in where a call needs one — stubborn agents, tricky cases',
			"Runs until you've found your home — no time limit",
		],
		// The FastSpring catalog still knows this product by its original slug;
		// renaming the path there would break existing checkout links.
		productPath: 'hunter',
		ctaLabel: 'Buy Marathon',
	},
	{
		name: 'Concierge',
		priceDisplay: '€399',
		tagline: 'A human by your side until the contract is signed.',
		term: 'One-time fee — charged once you sign a contract',
		features: [
			'Everything in Marathon',
			'A personal manager runs your search end to end — every call supervised, every viewing booked by a person',
			'Priority queue',
			'Price negotiation on your behalf',
			'Help with documents & requisitos',
			'Scam check on every listing',
			'Support until you sign',
		],
		productPath: 'concierge',
		ctaLabel: 'Buy Concierge',
	},
];
