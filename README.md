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
  tier cards, `src/scripts/pricing-checkout.ts` for the FastSpring SBL wiring, `src/lib/pricingCheckout.ts`
  for the tier content + FastSpring product paths). See "Pricing / FastSpring checkout" below. The
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

## Pricing / FastSpring checkout

`/pricing` is a real checkout page (`src/pages/pricing.astro`), separate from the waitlist flow —
the homepage's pricing section (`src/components/Pricing.astro`) is untouched and still opens the
waitlist modal. Tiers (Blitz, Hunter, Concierge) are one-time products — no subscriptions, no
monthly/yearly toggle — matching the copy on the homepage. Tier content and FastSpring product
paths live in `src/lib/pricingCheckout.ts`; edit that file to change features, taglines, or swap
in different product paths. The products themselves (name, price, tax category) are managed in
the FastSpring dashboard (Catalog → One-Time Products), not in this repo.

We switched from Paddle to FastSpring after Paddle declined the account. FastSpring has no npm
SDK — its Store Builder Library (SBL) is a plain `<script>` tag (`id="fsc-api"`, loaded directly
in `pricing.astro`) that self-initializes as `window.fastspring`. Price display is handled
declaratively by SBL's own directives (`data-fsc-item-path` + `data-fsc-item-price` on each price
span in `PricingCheckout.astro` — no JS involved, SBL fills them in and keeps them localized to
the visitor automatically). Client-side, `src/scripts/pricing-checkout.ts` only wires the buy
buttons: `fastspring.builder.reset()` + `.add(productPath)` populates the embedded checkout
container (`#fsc-embedded-checkout-container`, hidden until a tier is picked), which then renders
FastSpring's own payment form and order-complete state inline — there's no `successUrl`/redirect
step like Paddle had, because **FastSpring's docs are explicit that redirects aren't supported for
embedded checkouts** (only popup checkouts); the container's own inline confirmation is the
completion UI.

### Environment variables

Copy `.env.example` to `.env` (gitignored) and fill in:

| Variable | Value |
| :-- | :-- |
| `PUBLIC_FASTSPRING_STOREFRONT` | The storefront + embedded checkout path, e.g. `callmarta.test.onfastspring.com/embedded-pricing` (test store) or `callmarta.onfastspring.com/embedded-pricing` (live, once verified). Find it under Checkouts → Embedded Checkouts → your checkout → "Place on your website". |

Astro/Vite only expose `PUBLIC_`-prefixed vars to client-side code — that prefix is required, not
a style choice. These are inlined into the client bundle at **build time** (`npm run build`), not
read from the Worker's runtime `env` — so they must be set under Cloudflare's Worker
**Settings → Build → Variables and secrets** (the build-time ones), *not* the top-level
**Settings → Variables and secrets** section (that one is runtime-only and Vite never sees it —
setting the vars there silently does nothing for `PUBLIC_`-prefixed values). Setting or changing
them doesn't rebuild automatically; trigger a new build (push a commit) afterwards for the change
to take effect.

There's no separate secret API key involved on the client side — FastSpring's embedded checkout
doesn't need one. If a server-side integration (webhooks, the Contacts/Orders REST API) is added
later, that key is a genuinely secret credential and never belongs in this repo, the Worker, or
client code — same rule as the Resend API key in the waitlist backend above.

### Before this goes live

- **Whitelisted website domains**: FastSpring Dashboard → Checkouts → Embedded Checkouts → your
  checkout → domain whitelist. Embedded checkout refuses to load on domains not listed here —
  `callmarta.com` and `localhost:4321` are both whitelisted for the test store; add the production
  domain again on the live store once it exists. Domain changes take 15–20 minutes to propagate.
- **Store verification / going live**: the store starts in test mode (checklist item "Go Live!" in
  the FastSpring dashboard home). Real payments can't complete until that verification passes —
  until then, checkout renders and shows real prices, but a real payment won't complete. Once live,
  `PUBLIC_FASTSPRING_STOREFRONT` needs to be repointed from the `*.test.onfastspring.com` domain to
  the live one.
- **Product tax category**: all three tiers are set to `SW054002 Cloud Services - SaaS - Services
  agreement` — the closest fit for a calling/booking service with no better-matching category.
  Revisit if FastSpring flags it during verification.

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
