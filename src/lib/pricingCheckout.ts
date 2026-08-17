import { planRef } from './plans';

const price = (key: 'blitz' | 'marathon' | 'concierge') => '€' + planRef(key).priceEur;
const name = (key: 'blitz' | 'marathon' | 'concierge') => planRef(key).name;
const results = (key: 'blitz' | 'marathon' | 'concierge') => planRef(key).resultLimit;

export interface Tier {
	key: 'blitz' | 'marathon' | 'concierge';
	name: string;
	tagline: string;
	/** Static caption under the price — billing timing, not the amount itself. */
	term: string;
	features: string[];
	priceDisplay: string;
	ctaLabel: string;
}

// Display content only: purchases happen in the app (the cards deep-link to
// registration), so nothing here names a payment product.
export const PRICING_TIERS: Tier[] = [
	{
		key: 'blitz',
		name: name('blitz'),
		priceDisplay: price('blitz'),
		tagline: 'You found the listings. Marta gets you inside.',
		term: `One-time fee — for ${results('blitz')} results`,
		features: [
			'Send listings one by one, or drop a whole file',
			'Calls in Spanish within hours, retrying until someone picks up',
			'Full report on every listing: available or gone, recording and transcript of every call',
			"Viewing confirmations on WhatsApp — for you and for the agency, with each other's contacts",
			'We present you as a reliable tenant (nómina, insurance, pets)',
			'Money-back guarantee',
		],
		ctaLabel: 'Get started',
	},
	{
		key: 'marathon',
		name: name('marathon'),
		priceDisplay: price('marathon'),
		tagline: 'The whole hunt, until you move in.',
		term: `One-time fee — for ${results('marathon')} results`,
		features: [
			'Everything in Blitz',
			'Send listings as you find them, every day',
			'A real person steps in where a call needs one — stubborn agents, tricky cases',
			"Runs until you've found your home — no time limit",
		],
		ctaLabel: 'Get started',
	},
	{
		key: 'concierge',
		name: name('concierge'),
		priceDisplay: price('concierge'),
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
		ctaLabel: 'Talk to us',
	},
];
