export interface Env {
	RESEND_API_KEY: string;
	RESEND_SEGMENT_ID: string;
	MAIL_FROM: string;
	STRIPE_SECRET_KEY: string;
	STRIPE_WEBHOOK_SECRET: string;
	WAITLIST_KV?: KVNamespace;
	ASSETS: Fetcher;
}
