// Stripe Checkout (embedded) wiring for the /pricing page. Loaded only there — the
// homepage's Pricing.astro section still opens the waitlist modal (src/scripts/landing.ts).
// Stripe.js itself is loaded via a plain <script> tag in pricing.astro — there's no
// official npm package for the vanilla-JS client integration, only server-side
// (worker/stripe.ts uses the `stripe` package to create Checkout Sessions).

interface StripeEmbeddedCheckout {
	mount(selector: string): void;
	destroy(): void;
}

interface StripeInstance {
	createEmbeddedCheckoutPage(options: { fetchClientSecret: () => Promise<string> }): Promise<StripeEmbeddedCheckout>;
}

declare global {
	interface Window {
		Stripe?: (publishableKey: string) => StripeInstance;
	}
}

// Read at module load, not inside a try/catch — an unset key must fail loudly
// (console error visible on every page load) rather than silently breaking checkout.
const publishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
	throw new Error('PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Copy .env.example to .env and fill it in.');
}

const LOAD_TIMEOUT_MS = 8000;
const LOAD_POLL_INTERVAL_MS = 100;

function showLoadError() {
	document.querySelector<HTMLElement>('[data-checkout-error]')?.removeAttribute('hidden');
	document.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
		btn.disabled = true;
	});
}

function waitForStripeJs(): Promise<NonNullable<Window['Stripe']>> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const poll = () => {
			if (window.Stripe) {
				resolve(window.Stripe);
				return;
			}
			if (Date.now() - start > LOAD_TIMEOUT_MS) {
				reject(new Error('Stripe.js did not load in time'));
				return;
			}
			setTimeout(poll, LOAD_POLL_INTERVAL_MS);
		};
		poll();
	});
}

async function fetchClientSecret(productPath: string): Promise<string> {
	const res = await fetch('/api/create-checkout-session', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ productPath }),
	});
	if (!res.ok) {
		throw new Error(`create-checkout-session failed: ${res.status}`);
	}
	const data = (await res.json()) as { clientSecret?: string };
	if (!data.clientSecret) {
		throw new Error('create-checkout-session response missing clientSecret');
	}
	return data.clientSecret;
}

function wireBuyButtons(stripe: StripeInstance) {
	const grid = document.querySelector<HTMLElement>('[data-pricing-grid]');
	const panel = document.querySelector<HTMLElement>('[data-checkout-panel]');
	const backBtn = document.querySelector<HTMLButtonElement>('[data-checkout-back]');
	// Each tier switch needs a fresh Checkout Session (a Session is tied to the
	// line item it was created with) — the previous embedded instance must be
	// destroyed before mounting a new one, Stripe.js doesn't support reusing it.
	let currentCheckout: StripeEmbeddedCheckout | undefined;

	function showGrid() {
		currentCheckout?.destroy();
		currentCheckout = undefined;
		panel?.setAttribute('hidden', '');
		grid?.removeAttribute('hidden');
		grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	document.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
		btn.addEventListener('click', async () => {
			const productPath = btn.dataset.buy;
			if (!productPath) return;

			currentCheckout?.destroy();
			currentCheckout = undefined;

			grid?.setAttribute('hidden', '');
			panel?.removeAttribute('hidden');
			panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });

			try {
				currentCheckout = await stripe.createEmbeddedCheckoutPage({
					fetchClientSecret: () => fetchClientSecret(productPath),
				});
				currentCheckout.mount('#checkout');
			} catch (err) {
				console.error('Stripe embedded checkout failed to load', err);
				showGrid();
				showLoadError();
			}
		});
	});

	backBtn?.addEventListener('click', showGrid);
}

async function init() {
	if (document.querySelectorAll('[data-buy]').length === 0) return;

	try {
		const stripeFactory = await waitForStripeJs();
		wireBuyButtons(stripeFactory(publishableKey));
	} catch (err) {
		console.error('Stripe.js failed to load', err);
		showLoadError();
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
