import Stripe from 'stripe';
import type { Env } from './env';

// Product paths match src/lib/pricingCheckout.ts productPath values, and the
// lookup_key set on each Stripe Price when the catalog was created — this file
// never hardcodes a Price ID, only the productPath the client already sends.
const PRODUCT_PATHS = new Set(['blitz', 'hunter', 'concierge']);

// Labels Checkout Sessions from this integration for the Dashboard's conversion
// tracking (stripe-best-practices skill: needs an 8-random-letter suffix).
const INTEGRATION_IDENTIFIER = 'marta_web_checkout_qxrvbnkl';

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

function stripeClient(env: Env): Stripe {
	// Cloudflare Workers have no Node `http`/`crypto` — the fetch-based HTTP client
	// is Stripe's documented way to run the SDK on edge runtimes.
	return new Stripe(env.STRIPE_SECRET_KEY, {
		httpClient: Stripe.createFetchHttpClient(),
	});
}

export async function handleCreateCheckoutSession(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return json({ error: 'Method not allowed.' }, 405);
	}

	let payload: { productPath?: string };
	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const productPath = payload.productPath;
	if (!productPath || !PRODUCT_PATHS.has(productPath)) {
		return json({ error: 'Unknown product.' }, 400);
	}

	const stripe = stripeClient(env);

	try {
		const prices = await stripe.prices.list({ lookup_keys: [productPath], active: true, limit: 1 });
		const price = prices.data[0];
		if (!price) {
			console.error('No active Stripe price for lookup_key', productPath);
			return json({ error: 'Checkout is temporarily unavailable.' }, 502);
		}

		const origin = new URL(request.url).origin;
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			ui_mode: 'embedded_page',
			line_items: [{ price: price.id, quantity: 1 }],
			return_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
			integration_identifier: INTEGRATION_IDENTIFIER,
			// Managed Payments makes Stripe the merchant of record (tax, disputes,
			// support all handled by Stripe/Link, "Sold through Link" shown to the
			// customer) — the opposite of the fixed-price, we-handle-our-own-VAT
			// approach already chosen for this integration. Off, not just untouched:
			// it's enabled by default on this account.
			managed_payments: { enabled: false },
		});

		return json({ clientSecret: session.client_secret });
	} catch (err) {
		console.error('Stripe checkout session creation failed', err);
		return json({ error: 'Checkout is temporarily unavailable.' }, 502);
	}
}

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return json({ error: 'Method not allowed.' }, 405);
	}

	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return json({ error: 'Missing signature.' }, 400);
	}

	const body = await request.text();
	const stripe = stripeClient(env);

	let event: Stripe.Event;
	try {
		// constructEventAsync + the subtle-crypto provider is required here: the
		// default (Node crypto-based) signature check isn't available on Workers.
		event = await stripe.webhooks.constructEventAsync(
			body,
			signature,
			env.STRIPE_WEBHOOK_SECRET,
			undefined,
			Stripe.createSubtleCryptoProvider(),
		);
	} catch (err) {
		console.error('Stripe webhook signature verification failed', err);
		return json({ error: 'Invalid signature.' }, 400);
	}

	// Fulfillment must never depend on the return page — a customer can pay
	// successfully and lose their connection before it loads. Handle both the
	// sync and delayed-notification completion events, gated on payment_status
	// so a completed-but-still-unpaid session (e.g. a bank redirect in flight)
	// doesn't trigger a notification twice or too early.
	if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
		const session = event.data.object;
		if (session.payment_status !== 'unpaid') {
			await notifyOrder(session, env);
		}
	} else if (event.type === 'checkout.session.async_payment_failed') {
		console.error('Async payment failed', event.data.object.id);
	}

	return json({ received: true });
}

// Best-effort team notification, mirroring the waitlist welcome-email pattern in
// waitlist.ts. There's no order/CRM backend in this repo — the team picks up new
// orders from this email (Stripe's own Dashboard is the order system of record).
async function notifyOrder(session: Stripe.Checkout.Session, env: Env): Promise<void> {
	const amount = session.amount_total != null ? (session.amount_total / 100).toFixed(2) : '?';
	const currency = session.currency?.toUpperCase() ?? '';
	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: `Marta <${env.MAIL_FROM}>`,
				to: [env.MAIL_FROM],
				reply_to: session.customer_details?.email ?? env.MAIL_FROM,
				subject: `New order: ${amount} ${currency}`,
				text: `Stripe Checkout Session ${session.id} completed.\nCustomer: ${session.customer_details?.email ?? 'unknown'}\nAmount: ${amount} ${currency}`,
			}),
		});
		if (!res.ok) {
			console.error('Order notification email failed', res.status, await res.text());
		}
	} catch (err) {
		console.error('Order notification email threw', err);
	}
}
