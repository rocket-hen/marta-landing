# marta-landing

Marketing site + blog for Marta (`callmarta.com`). Astro-built static site, ported from the
[Claude Design](https://claude.ai/design) mockup, deployed to Cloudflare as a Worker with static
assets. The app itself lives in the sibling `marta/` repo — this project has no backend of its
own beyond the one `/api/waitlist` route.

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`       | Start the Astro dev server at `localhost:4321` (**does not** run `/api/waitlist` — see below) |
| `npm run build`     | Build the static site to `./dist/`          |
| `npm run preview`   | Build, then serve via `wrangler dev` at `localhost:8788` — the only way to exercise `worker/` locally |
| `npm run deploy`    | Build, then `wrangler deploy` — manual deploy; normally unnecessary, see "Deploying" below |

## Structure

- `src/pages/index.astro` — landing page, assembled from `src/components/*`
- `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro` — blog list/post, backed by the
  `blog` content collection at `src/content/blog/*.md` (schema in `src/content.config.ts`)
- `src/pages/privacy.astro`, `src/pages/terms.astro` — legal pages, backed by the `legal`
  content collection at `src/content/legal/{privacy,terms}.md`. To edit the copy, just edit
  those Markdown files (directly on GitHub is fine) — frontmatter is `title` + `lastUpdated`,
  everything else is the page body. Shared chrome (eyebrow, title, "Last updated" date) lives
  in `src/layouts/LegalLayout.astro`.
- `src/scripts/landing.ts` — all of the landing page's interactivity (hero call-status
  animation, waveform demo player, EN/ES toggle, FAQ accordion, waitlist modal). Loaded only
  on the home page.
- `src/styles/global.css` — design tokens (colors, fonts, shared button/link states) shared by
  every page.
- `src/pages/pricing.astro` — real checkout page (`src/components/PricingCheckout.astro` for the
  tier cards, `src/scripts/pricing-checkout.ts` for the Stripe.js embedded-checkout wiring,
  `src/lib/pricingCheckout.ts` for the tier content + product paths, `worker/stripe.ts` for the
  server-side Checkout Session + webhook routes). See "Pricing / Stripe checkout" below. The
  homepage's `src/components/Pricing.astro` section is unrelated — it still just opens the waitlist modal.
- `worker/` — the Cloudflare Worker that fronts the deployed site (see "Waitlist backend" and
  "Deploying" below). Not part of the Astro build; has its own `tsconfig.json` since it runs on
  the Workers runtime, not a browser, and needs different global types than `src/`.
- `wrangler.jsonc` — Worker config: entry point (`worker/index.ts`), and the `assets` block that
  points at `./dist` so the Worker also serves the static site.

## Waitlist backend

The waitlist form (`src/components/WaitlistModal.astro`) collects just an email address (plus an
invisible honeypot field) and POSTs it to `/api/waitlist`. That route is handled by
`worker/waitlist.ts`; every other request falls through to `env.ASSETS.fetch(request)`, i.e. the
static build (`worker/index.ts` is the routing entry point). It upserts a contact in Resend by
email, adds it to a waitlist segment, and sends a welcome email — plain `fetch` against
`api.resend.com`, no Resend SDK. The Resend API key never reaches the browser. No custom contact
properties are collected or stored — just the email and segment membership.

**Why a Worker and not classic "Pages Functions"**: this project is provisioned in Cloudflare as
a Worker (with static assets), not a classic Pages project — that distinction determines which
deploy model applies, and Workers-with-assets needs an explicit `wrangler.jsonc` + entry point
rather than an auto-detected `/functions` directory. (If you ever recreate this as a classic
Pages project instead, the routing in `worker/index.ts` would need to move back to a
`functions/api/waitlist.ts` file export — ask before doing that, it's a real restructure.)

### Local development

1. `cp .dev.vars.example .dev.vars` and fill in real (ideally sandbox/test) values.
   `.dev.vars` is gitignored — never commit it.
2. `astro dev` does **not** run the Worker. Use `npm run preview` instead — it builds the site
   and serves it via `wrangler dev`, which runs `worker/` and serves `dist/` through it, at
   `http://localhost:8788`.
3. Test the endpoint directly:
   ```
   curl -X POST http://localhost:8788/api/waitlist \
     -H 'content-type: application/json' \
     -d '{"email":"you@example.com"}'
   ```

### One-time Resend setup

The waitlist segment must exist before the function can add contacts to it — there's no
"create if missing" endpoint to call per-request, so this is a one-time step. Either create it
via the Resend dashboard (Audiences/Segments → new segment, e.g. named "Waitlist"), or:

```
curl -X POST https://api.resend.com/segments \
  -H "Authorization: Bearer $RESEND_API_KEY" -H 'content-type: application/json' \
  -d '{"name":"Waitlist"}'
```

The `id` in the response is your `RESEND_SEGMENT_ID`.

### Production environment variables

`MAIL_FROM` and `RESEND_SEGMENT_ID` are plain (non-secret) values, so they live in `wrangler.jsonc`'s
`vars` block and get committed — **do not** set them as plain variables via the Cloudflare dashboard
instead. `wrangler deploy` (which is what Cloudflare Workers Builds runs on every push) fully syncs
plain vars from `wrangler.jsonc` on each deploy — anything set only via the dashboard's "Variables
and secrets" screen gets silently wiped out on the next push. Only `RESEND_API_KEY` goes in the
dashboard, because secrets aren't touched by `wrangler deploy` and shouldn't be committed:

Cloudflare dashboard → your Worker → **Settings → Variables and secrets**:

| Variable | Value | Type |
| :-- | :-- | :-- |
| `RESEND_API_KEY` | from the Resend dashboard | **Secret** (not a plain variable) |

(This screen is disabled/greyed out if the Worker has no deployed Worker script yet — i.e.
before the first successful deploy with `wrangler.jsonc` in place.)

### Optional: raw lead backup (KV)

If a KV namespace bound as `WAITLIST_KV` exists, the function also writes each raw submission
to it under `lead:<timestamp>:<email>` — a second copy of the lead list outside Resend. This is
optional; if the binding is absent the function silently skips that step. To add it: Cloudflare
dashboard → Workers & Pages → KV → create a namespace, then your Worker → **Settings → Bindings**
→ add a KV namespace binding named `WAITLIST_KV` pointing at it.

### Where to review leads

- **Resend dashboard** → Contacts → the waitlist segment — the primary, always-up-to-date list
  of who's signed up.
- **KV namespace** (if bound) — raw JSON per submission, useful as a backup or for bulk export;
  browse via Cloudflare dashboard → Workers & Pages → KV → the namespace, or `wrangler kv key list`.

## Pricing / Stripe checkout

`/pricing` is a real checkout page (`src/pages/pricing.astro`), separate from the waitlist flow —
the homepage's pricing section (`src/components/Pricing.astro`) is untouched and still opens the
waitlist modal. Tiers (Blitz, Marathon, Concierge) are one-time Stripe Prices — no subscriptions,
no monthly/yearly toggle — matching the copy on the homepage. Tier content + `productPath` values
live in `src/lib/pricingCheckout.ts`; `priceDisplay` there is a **fixed, literal string** (`€49`
etc.), not a placeholder — see "Tax" below for why. The Stripe Products/Prices themselves are
managed in the Stripe Dashboard (Catalog), keyed by matching `lookup_key` = `productPath`; this
repo never hardcodes a Price ID.

We switched Paddle → FastSpring → Stripe (Paddle declined the account; FastSpring worked but the
team wanted Stripe). Unlike FastSpring's all-client-side SBL widget, Stripe Checkout needs a
server-side step: `worker/stripe.ts` exposes `POST /api/create-checkout-session` (looks up the
Price by `lookup_key`, creates a `mode: 'payment', ui_mode: 'embedded_page'` Checkout Session, and
returns its `client_secret` — never the secret key) and `POST /api/stripe-webhook` (signature-
verified fulfillment). Client-side, `src/scripts/pricing-checkout.ts` loads Stripe.js
(`<script is:inline src="https://js.stripe.com/dahlia/stripe.js">` in `pricing.astro` — there's no
npm package for the vanilla-JS client, only server-side), calls `stripe.createEmbeddedCheckoutPage()`
with a `fetchClientSecret` that POSTs to `/api/create-checkout-session`, and mounts the result into
`#checkout`. Switching tiers destroys the previous embedded-checkout instance and creates a fresh
Session — a Session is tied to the line item it was created with, Stripe.js can't reuse one.

**Fulfillment is webhook-driven, not page-driven** — `checkout.session.completed` and
`checkout.session.async_payment_succeeded` (gated on `payment_status !== 'unpaid'`) trigger a
best-effort team notification email via Resend (same pattern as the waitlist welcome email; there's
no order/CRM backend in this repo, Stripe's own Dashboard is the order system of record). Never
move that logic to the `/welcome` return page — Stripe's own docs are explicit that a customer can
pay successfully and never load the return page, silently dropping the order.

**Tax**: Stripe is *not* a merchant of record here — unlike Paddle/FastSpring, VAT/sales-tax
compliance is on us, not Stripe. `automatic_tax` is deliberately **off** (no active Stripe Tax
registration exists yet — turning it on without one silently collects $0 tax while looking
correctly configured). Prices are fixed, tax-inclusive-by-assumption amounts until that changes.
Relatedly, **Managed Payments is explicitly disabled** (`managed_payments: { enabled: false }` in
`worker/stripe.ts`) — it's a separate, newer Stripe feature that also makes Stripe the merchant of
record ("Sold through Link", tax/disputes/support all handled by Stripe) and is *enabled by default*
on new accounts; leaving it on would silently reintroduce the same MoR situation the fixed-price
decision was meant to opt out of, and Checkout Session creation fails outright without it unless
every Product has a `tax_code` set.

### Environment variables

Copy `.env.example` to `.env` (gitignored) and fill in:

| Variable | Value |
| :-- | :-- |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side, safe to expose — Stripe Dashboard → Developers → API keys. `pk_test_...` for sandbox, `pk_live_...` once live. |

`.dev.vars` (gitignored, for `npm run preview`/`wrangler dev`) also needs:

| Variable | Value |
| :-- | :-- |
| `STRIPE_SECRET_KEY` | Server-side only, genuinely secret — Dashboard → Developers → API keys. `sk_test_...` / `sk_live_...`. |
| `STRIPE_WEBHOOK_SECRET` | Server-side only — Dashboard → Developers → Webhooks → your endpoint → "Signing secret" (`whsec_...`). Required to create/verify a webhook endpoint pointed at `https://<your-domain>/api/stripe-webhook` first; see "Before this goes live" below. |

Astro/Vite only expose `PUBLIC_`-prefixed vars to client-side code — that prefix is required, not
a style choice. `PUBLIC_STRIPE_PUBLISHABLE_KEY` is inlined into the client bundle at **build time**
(`npm run build`), not read from the Worker's runtime `env` — so it must be set under Cloudflare's
Worker **Settings → Build → Variables and secrets** (the build-time ones), *not* the top-level
**Settings → Variables and secrets** section (that one is runtime-only and Vite never sees it).
`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are the opposite: genuine runtime secrets, read via
`env.X` inside the Worker, and belong in the top-level **Settings → Variables and secrets** as
**Secrets**, alongside `RESEND_API_KEY` — never in `wrangler.jsonc` (that file is committed).
Setting or changing the build variable doesn't rebuild automatically; trigger a new build (push a
commit) afterwards for the change to take effect.

### Before this goes live

- **Live-mode Products/Prices**: the Stripe Dashboard's test/live modes have separate catalogs —
  the test-mode Products created for sandbox testing don't carry over. Recreate them in live mode
  (or use the Dashboard's "Copy to live mode" action on each test Product), matching the same
  `lookup_key` values (`blitz`, `hunter`, `concierge` — the FastSpring-era slug is kept for
  `hunter`/Marathon to avoid touching checkout code for a rename).
- **Live webhook endpoint**: `POST /api/stripe-webhook` needs its own live-mode registration
  (Dashboard → Developers → Webhooks → Add endpoint → the production URL), which generates a
  separate `whsec_...` — swap `STRIPE_WEBHOOK_SECRET` in Cloudflare when switching to live.
- **Live secret/publishable keys**: swap `sk_test_.../pk_test_...` for `sk_live_.../pk_live_...`
  in both Cloudflare's runtime secrets and the Build variable.
- **Tax**: register for Stripe Tax (or handle VAT/sales-tax compliance some other way) before
  relying on the fixed prices being correct for every buyer's jurisdiction — see "Tax" above.

## Deploying

Connected via Cloudflare Workers Builds (Git integration — **Workers & Pages → your project →
Settings → Build**, repo `rocket-hen/marta-landing`). Every push to `main` auto-builds and
deploys: build command `npm run build`, deploy command `npx wrangler deploy` (the default —
reads `wrangler.jsonc` to know about `worker/index.ts` and the `./dist` assets directory, so
there's nothing else to configure there).

Custom domain: add `callmarta.com` (and `www.callmarta.com` for the redirect) under the Worker's
**Domains & Routes** (or **Custom domains**, depending on dashboard version). If the domain's
already on this Cloudflare account, DNS records are added automatically; otherwise point the
registrar's nameservers at Cloudflare first.

Env vars and the `WAITLIST_KV` binding go in the Worker's **Settings** (Variables and secrets /
Bindings), not in a committed file — see "Waitlist backend" above for the exact variables needed.
