// Cloudflare Pages Function — POST /api/waitlist
// Exporting only `onRequestPost` makes Cloudflare answer every other method with 405
// automatically; there's no need to hand-roll that check.

interface Env {
	RESEND_API_KEY: string;
	RESEND_SEGMENT_ID: string;
	MAIL_FROM: string;
	WAITLIST_KV?: KVNamespace;
}

interface WaitlistPayload {
	email?: string;
	leadType?: string;
	city?: string;
	moveTimeline?: string;
	budget?: string;
	pain?: string;
	consent?: boolean;
	company?: string; // honeypot — real users never fill this in
	referrer?: string;
	utmSource?: string;
	utmCampaign?: string;
}

const RESEND_API = 'https://api.resend.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// These are also the exact values used for the <select>/<option> markup and the copy
// shown in Resend's dashboard, so there's one canonical string per option, not a slug
// that needs translating back to a label somewhere else.
const ALLOWED_CITIES = [
	'Madrid',
	'Barcelona',
	'Valencia',
	'Málaga',
	'Alicante',
	'Sevilla',
	'Palma',
	'Las Palmas',
	'Tenerife',
	'Bilbao',
	'Granada',
	'Marbella',
	'San Sebastián',
	'Zaragoza',
	'Other',
];
const ALLOWED_LEAD_TYPES = ['Renting', 'Buying'];
const ALLOWED_TIMELINES = ['ASAP', 'Within 1 month', '1–3 months', 'Just exploring'];
const ALLOWED_BUDGETS = ['Under €800', '€800–1200', '€1200–1800', '€1800+'];
const MAX_PAIN_LENGTH = 1000;

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

function badRequest(message: string): Response {
	return json({ error: message }, 400);
}

function resendFailureResponse(status: number): Response {
	if (status === 429) {
		return json({ error: 'Too many requests. Please try again in a moment.' }, 429);
	}
	return json({ error: 'Something went wrong saving your details. Please try again.' }, 500);
}

function welcomeHtml(): string {
	// Deliberately dumb: no web fonts, no background images, fixed 600px table layout,
	// every style inline — this needs to render correctly in the worst email clients.
	return `<!doctype html>
<html>
<body style="margin:0;padding:0;background-color:#FAFAF8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #E3E0D8;">
<tr><td style="padding:40px 32px;font-family:Helvetica,Arial,sans-serif;color:#1A1917;">
<p style="margin:0 0 24px;font-size:20px;font-weight:bold;">marta<span style="color:#B0512E;">.</span></p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi,</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">You're on the Marta waitlist. Thanks for your patience while we get ready.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">We'll write to you as soon as we're live in your city. In the meantime, if you want to tell us more about your search — or just say hi — hit reply. A real person reads these.</p>
<p style="margin:0;font-size:16px;line-height:1.6;">&mdash; The Marta team</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function welcomeText(): string {
	return [
		'Hi,',
		'',
		"You're on the Marta waitlist. Thanks for your patience while we get ready.",
		'',
		"We'll write to you as soon as we're live in your city. In the meantime, if you want to tell us more about your search — or just say hi — hit reply. A real person reads these.",
		'',
		'— The Marta team',
	].join('\n');
}

async function handlePost({ request, env }: { request: Request; env: Env }): Promise<Response> {
	let payload: WaitlistPayload;
	try {
		payload = await request.json();
	} catch {
		return badRequest('Invalid request body.');
	}

	// Honeypot: a bot that fills this in gets an indistinguishable fake success.
	if (payload.company) {
		return json({ ok: true });
	}

	const email = (payload.email ?? '').trim().toLowerCase();
	if (!EMAIL_RE.test(email)) {
		return badRequest('Please enter a valid email address.');
	}
	if (payload.consent !== true) {
		return badRequest('Please accept the privacy policy to join the waitlist.');
	}
	if (!ALLOWED_LEAD_TYPES.includes(payload.leadType ?? '')) {
		return badRequest('Please select whether you are renting or buying.');
	}
	if (!ALLOWED_CITIES.includes(payload.city ?? '')) {
		return badRequest('Please select a valid city.');
	}
	if (!ALLOWED_TIMELINES.includes(payload.moveTimeline ?? '')) {
		return badRequest('Please select your move timeline.');
	}
	if (!ALLOWED_BUDGETS.includes(payload.budget ?? '')) {
		return badRequest('Please select your budget range.');
	}
	const pain = (payload.pain ?? '').trim();
	if (pain.length > MAX_PAIN_LENGTH) {
		return badRequest(`That answer is a bit long — please keep it under ${MAX_PAIN_LENGTH} characters.`);
	}

	const sourceParts: string[] = [];
	if (payload.referrer) sourceParts.push(`referrer=${payload.referrer}`);
	if (payload.utmSource) sourceParts.push(`utm_source=${payload.utmSource}`);
	if (payload.utmCampaign) sourceParts.push(`utm_campaign=${payload.utmCampaign}`);
	const source = sourceParts.join(' | ');

	const properties: Record<string, string> = {
		lead_type: payload.leadType!,
		city: payload.city!,
		move_timeline: payload.moveTimeline!,
		budget: payload.budget!,
		consent_at: new Date().toISOString(),
	};
	if (pain) properties.pain = pain;
	if (source) properties.source = source;

	const resendHeaders = {
		Authorization: `Bearer ${env.RESEND_API_KEY}`,
		'Content-Type': 'application/json',
	};

	let contactId: string | undefined;

	try {
		// Idempotent upsert: Resend's docs don't document what POST /contacts does with a
		// duplicate email, so don't depend on that — update-by-email first (confirmed
		// supported), and only create if the contact doesn't exist yet (404).
		const updateRes = await fetch(`${RESEND_API}/contacts/${encodeURIComponent(email)}`, {
			method: 'PATCH',
			headers: resendHeaders,
			body: JSON.stringify({ properties }),
		});

		if (updateRes.ok) {
			const data = (await updateRes.json()) as { id?: string };
			contactId = data.id;
		} else if (updateRes.status === 404) {
			const createRes = await fetch(`${RESEND_API}/contacts`, {
				method: 'POST',
				headers: resendHeaders,
				body: JSON.stringify({ email, properties }),
			});
			if (!createRes.ok) {
				console.error('Resend contact create failed', createRes.status, await createRes.text());
				return resendFailureResponse(createRes.status);
			}
			const data = (await createRes.json()) as { id?: string };
			contactId = data.id;
		} else {
			console.error('Resend contact update failed', updateRes.status, await updateRes.text());
			return resendFailureResponse(updateRes.status);
		}

		// Ensure segment membership regardless of which path above ran. Failure here is
		// logged but non-fatal — the contact itself is already saved, which is what matters.
		if (contactId && env.RESEND_SEGMENT_ID) {
			const segRes = await fetch(`${RESEND_API}/contacts/${contactId}/segments`, {
				method: 'POST',
				headers: resendHeaders,
				body: JSON.stringify({ segments: [env.RESEND_SEGMENT_ID] }),
			});
			if (!segRes.ok) {
				console.error('Resend segment add failed', segRes.status, await segRes.text());
			}
		}
	} catch (err) {
		console.error('Resend contact upsert threw', err);
		return json({ error: 'Something went wrong saving your details. Please try again.' }, 500);
	}

	// Welcome email — best effort. A failed send must not fail the request; the contact
	// is already saved, which is what matters.
	try {
		const emailRes = await fetch(`${RESEND_API}/emails`, {
			method: 'POST',
			headers: {
				...resendHeaders,
				// Deterministic per address so an accidental double-submit within the same
				// 24h window doesn't send a second welcome email.
				'Idempotency-Key': `waitlist-welcome-${email}`,
			},
			body: JSON.stringify({
				from: `Marta <${env.MAIL_FROM}>`,
				to: [email],
				reply_to: env.MAIL_FROM,
				subject: "You're on the Marta waitlist",
				html: welcomeHtml(),
				text: welcomeText(),
			}),
		});
		if (!emailRes.ok) {
			console.error('Welcome email send failed', emailRes.status, await emailRes.text());
		}
	} catch (err) {
		console.error('Welcome email send threw', err);
	}

	// Best-effort raw backup so the lead list isn't a single copy of truth inside Resend.
	if (env.WAITLIST_KV) {
		try {
			const key = `lead:${Date.now()}:${email}`;
			await env.WAITLIST_KV.put(
				key,
				JSON.stringify({ email, ...properties, submittedAt: new Date().toISOString() }),
			);
		} catch (err) {
			console.error('WAITLIST_KV write failed', err);
		}
	}

	return json({ ok: true });
}

// wrangler's local Pages dev (and, per testing, the deployed router too) falls through to
// the static-asset/SPA-fallback handler for methods with no matching onRequest* export —
// it does not synthesize a 405 on its own. Handle method dispatch explicitly instead.
export const onRequest: PagesFunction<Env> = async (context) => {
	if (context.request.method !== 'POST') {
		return json({ error: 'Method not allowed.' }, 405);
	}
	return handlePost(context);
};
