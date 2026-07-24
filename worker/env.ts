export interface Env {
	RESEND_API_KEY: string;
	RESEND_SEGMENT_ID: string;
	MAIL_FROM: string;
	WAITLIST_KV?: KVNamespace;
	ASSETS: Fetcher;
}
