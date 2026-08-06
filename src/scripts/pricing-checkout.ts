// Paddle.js integration for the /pricing checkout page. Loaded only there — the
// homepage's Pricing.astro section still opens the waitlist modal (src/scripts/landing.ts).

import { initializePaddle, type Environments, type Paddle } from '@paddle/paddle-js';
import { PRICING_TIERS } from '../lib/pricingCheckout';

// Read at module load, not inside a try/catch — an unset or misspelled environment
// must fail loudly (console error visible on every page load) rather than silently
// falling back to sandbox or production, which would risk running against the wrong
// Paddle account.
const clientToken = import.meta.env.PUBLIC_PADDLE_CLIENT_TOKEN;
const environment = import.meta.env.PUBLIC_PADDLE_ENVIRONMENT as Environments | undefined;

if (!clientToken) {
	throw new Error('PUBLIC_PADDLE_CLIENT_TOKEN is not set. Copy .env.example to .env and fill it in.');
}
if (environment !== 'sandbox' && environment !== 'production') {
	throw new Error(
		`PUBLIC_PADDLE_ENVIRONMENT must be "sandbox" or "production", got: ${JSON.stringify(environment ?? null)}`,
	);
}

async function detectCountry(): Promise<string | undefined> {
	try {
		const res = await fetch('/api/geo');
		if (!res.ok) return undefined;
		const data = (await res.json()) as { country?: string | null };
		return data.country ?? undefined;
	} catch {
		// Worker route unreachable (e.g. plain `astro dev`, which doesn't run worker/) —
		// Paddle.PricePreview() still auto-detects location from the visitor's IP.
		return undefined;
	}
}

function showLoadError() {
	document.querySelector<HTMLElement>('[data-checkout-error]')?.removeAttribute('hidden');
	document.querySelectorAll<HTMLButtonElement>('[data-subscribe]').forEach((btn) => {
		btn.disabled = true;
	});
}

async function renderPrices(paddle: Paddle) {
	const priceEls = Array.from(document.querySelectorAll<HTMLElement>('[data-price-id]'));
	if (priceEls.length === 0) return;

	const country = await detectCountry();

	const preview = await paddle.PricePreview({
		items: PRICING_TIERS.map((tier) => ({ priceId: tier.priceId, quantity: 1 })),
		...(country ? { address: { countryCode: country } } : {}),
	});

	for (const item of preview.data.details.lineItems) {
		const el = document.querySelector<HTMLElement>(`[data-price-id="${item.price.id}"]`);
		// Display only what Paddle returns — no re-formatting, no price math.
		if (el) el.textContent = item.formattedTotals.total;
	}
}

function wireSubscribeButtons(paddle: Paddle) {
	document.querySelectorAll<HTMLButtonElement>('[data-subscribe]').forEach((btn) => {
		btn.addEventListener('click', () => {
			const priceId = btn.dataset.subscribe;
			if (!priceId) return;
			paddle.Checkout.open({
				items: [{ priceId, quantity: 1 }],
				settings: {
					displayMode: 'overlay',
					variant: 'one-page',
					successUrl: `${window.location.origin}/welcome`,
				},
			});
		});
	});
}

async function init() {
	if (document.querySelectorAll('[data-price-id]').length === 0) return;

	const paddle = await initializePaddle({ token: clientToken, environment });
	if (!paddle) {
		showLoadError();
		return;
	}

	wireSubscribeButtons(paddle);

	try {
		await renderPrices(paddle);
	} catch (err) {
		console.error('Paddle PricePreview failed', err);
		showLoadError();
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}