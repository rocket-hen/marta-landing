export interface Tier {
	name: 'Blitz' | 'Hunter' | 'Concierge';
	tagline: string;
	/** Static caption under the Paddle-rendered price — billing timing, not the amount itself. */
	term: string;
	features: string[];
	priceId: string;
	ctaLabel: string;
}

// Paddle product/price IDs — created in the live Paddle catalog to match the flat-fee
// tiers described on the homepage pricing section (src/components/Pricing.astro). Every
// tier is a one-time price (no billing_cycle) — this business has no subscriptions.
export const PRICING_TIERS: Tier[] = [
	{
		name: 'Blitz',
		tagline: 'You found the listings. Marta gets you inside.',
		term: 'One-time fee — active for 3 months',
		features: [
			'Send up to 15 listings (one by one or as a list)',
			'Calls in Spanish within hours',
			'Full report within hours: status of every listing',
			'Recordings & transcripts of every call',
			'Viewings booked straight into your calendar',
			'We present you as a reliable tenant (nómina, insurance, pets)',
			'Real humans step in when needed',
			'Money-back guarantee',
		],
		priceId: 'pri_01kzbcpbt2ezwbhxajg0q2mbyp',
		ctaLabel: 'Buy Blitz',
	},
	{
		name: 'Hunter',
		tagline: 'New listings get called in minutes — before anyone else replies.',
		term: 'One-time fee — active until you find your home, up to 90 days',
		features: [
			'Everything in Blitz',
			'Unlimited listings',
			'Set a search filter — new listings enter the call queue automatically',
			'Calls within minutes of publication',
			'Retries + WhatsApp follow-up when nobody picks up',
			'Reschedule or confirm viewings anytime',
		],
		priceId: 'pri_01kzbcpc2anaqpsth3b0z2he6j',
		ctaLabel: 'Buy Hunter',
	},
	{
		name: 'Concierge',
		tagline: 'A human by your side until the contract is signed.',
		term: 'One-time fee — charged once you sign a contract',
		features: [
			'Everything in Hunter',
			'Personal manager, priority queue',
			'Price negotiation on your behalf',
			'Help with documents & requisitos',
			'Scam check on every listing',
			'Support until you sign',
		],
		priceId: 'pri_01kzbcpcc60ynpsyf11rf9rrb1',
		ctaLabel: 'Buy Concierge',
	},
];
