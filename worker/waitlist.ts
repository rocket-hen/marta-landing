import type { Env } from './env';

interface WaitlistPayload {
	email?: string;
	company?: string; // honeypot — real users never fill this in
}

const RESEND_API = 'https://api.resend.com';
const WELCOME_TEMPLATE_ID = 'marta-beta-invite';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

function badRequest(message: string): Response {
	return json({ error: message }, 400);
}

export async function handleWaitlist(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return json({ error: 'Method not allowed.' }, 405);
	}

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

	const resendHeaders = {
		Authorization: `Bearer ${env.RESEND_API_KEY}`,
		'Content-Type': 'application/json',
	};

	// Contact upsert is best-effort bookkeeping for future broadcasts — it must not block
	// the welcome email below, which is the part the user actually notices.
	let contactId: string | undefined;

	try {
		// Idempotent upsert: Resend's docs don't document what POST /contacts does with a
		// duplicate email, so don't depend on that — check-by-email first (PATCH doubles as
		// an existence check here, since there's nothing else to update), and only create if
		// the contact doesn't exist yet (404).
		const checkRes = await fetch(`${RESEND_API}/contacts/${encodeURIComponent(email)}`, {
			method: 'PATCH',
			headers: resendHeaders,
			body: JSON.stringify({}),
		});

		if (checkRes.ok) {
			const data = (await checkRes.json()) as { id?: string };
			contactId = data.id;
		} else if (checkRes.status === 404) {
			const createRes = await fetch(`${RESEND_API}/contacts`, {
				method: 'POST',
				headers: resendHeaders,
				body: JSON.stringify({ email }),
			});
			if (createRes.ok) {
				const data = (await createRes.json()) as { id?: string };
				contactId = data.id;
			} else {
				console.error('Resend contact create failed', createRes.status, await createRes.text());
			}
		} else {
			console.error('Resend contact check failed', checkRes.status, await checkRes.text());
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
				template: { id: WELCOME_TEMPLATE_ID },
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
			await env.WAITLIST_KV.put(key, JSON.stringify({ email, submittedAt: new Date().toISOString() }));
		} catch (err) {
			console.error('WAITLIST_KV write failed', err);
		}
	}

	return json({ ok: true });
}
