// FastSpring Store Builder Library (SBL) wiring for the /pricing embedded checkout. Loaded
// only there — the homepage's Pricing.astro section still opens the waitlist modal
// (src/scripts/landing.ts). The SBL script itself (id="fsc-api") is loaded via a plain
// <script> tag in pricing.astro, not an npm package — FastSpring has no JS SDK to import.
//
// Price display is handled declaratively by SBL's own directives (data-fsc-item-path /
// data-fsc-item-price on the price spans in PricingCheckout.astro) — no JS needed for that,
// unlike the old Paddle.PricePreview() call.

declare global {
	interface Window {
		fastspring?: {
			builder: {
				reset(): void;
				add(productPath: string, callback?: () => void): void;
			};
		};
	}
}

const LOAD_TIMEOUT_MS = 8000;
const LOAD_POLL_INTERVAL_MS = 100;

function showLoadError() {
	document.querySelector<HTMLElement>('[data-checkout-error]')?.removeAttribute('hidden');
	document.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
		btn.disabled = true;
	});
}

function waitForFastSpring(): Promise<Window['fastspring']> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const poll = () => {
			if (window.fastspring?.builder) {
				resolve(window.fastspring);
				return;
			}
			if (Date.now() - start > LOAD_TIMEOUT_MS) {
				reject(new Error('FastSpring SBL did not load in time'));
				return;
			}
			setTimeout(poll, LOAD_POLL_INTERVAL_MS);
		};
		poll();
	});
}

function wireBuyButtons(fastspring: NonNullable<Window['fastspring']>) {
	const grid = document.querySelector<HTMLElement>('[data-pricing-grid]');
	const panel = document.querySelector<HTMLElement>('[data-checkout-panel]');
	const backBtn = document.querySelector<HTMLButtonElement>('[data-checkout-back]');

	document.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
		btn.addEventListener('click', () => {
			const productPath = btn.dataset.buy;
			if (!productPath) return;

			fastspring.builder.reset();
			fastspring.builder.add(productPath);

			grid?.setAttribute('hidden', '');
			panel?.removeAttribute('hidden');
			panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});

	backBtn?.addEventListener('click', () => {
		fastspring.builder.reset();
		panel?.setAttribute('hidden', '');
		grid?.removeAttribute('hidden');
		grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});
}

async function init() {
	if (document.querySelectorAll('[data-buy]').length === 0) return;

	try {
		const fastspring = await waitForFastSpring();
		if (!fastspring) {
			showLoadError();
			return;
		}
		wireBuyButtons(fastspring);
	} catch (err) {
		console.error('FastSpring SBL failed to load', err);
		showLoadError();
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
