/**
 * The landing's plan catalog — names, prices, and where each card sends
 * people. One place: Pricing.astro, PricingCheckout.astro, schema.ts and
 * pricingCheckout.ts all draw from here, so a price change edits one line.
 *
 * The app keeps the operational mirror in marta/app/domain/plans.py (limits,
 * Stripe lookup keys, the trial) — when this file changes, check that one.
 */

export const APP_URL = 'https://app.callmarta.com';

export interface PlanRef {
	key: 'blitz' | 'marathon' | 'concierge';
	name: string;
	priceEur: number;
	/** How many results the plan covers — mirror of the app catalog's limit. */
	resultLimit: number;
}

export const PLAN_REFS: PlanRef[] = [
	{ key: 'blitz', name: 'Blitz', priceEur: 49, resultLimit: 15 },
	{ key: 'marathon', name: 'Marathon', priceEur: 99, resultLimit: 100 },
	{ key: 'concierge', name: 'Concierge', priceEur: 399, resultLimit: 100 },
];

export const planRef = (key: PlanRef['key']): PlanRef => {
	const ref = PLAN_REFS.find((p) => p.key === key);
	if (!ref) throw new Error(`unknown plan ${key}`);
	return ref;
};

/** Where a pricing card sends people: registration, remembering their pick. */
export const registerUrl = (key: PlanRef['key']) => `${APP_URL}/register?plan=${key}`;
