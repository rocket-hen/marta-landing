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
- `src/pages/pricing.astro` — the plans page (`src/components/PricingCheckout.astro` for the
  tier cards, `src/lib/pricingCheckout.ts` for the tier copy, `src/lib/plans.ts` for names,
  prices and register links). Cards deep-link to the app's registration — no payment happens
  on the landing; see "Pricing" below. The homepage's `src/components/Pricing.astro` section
  is unrelated — it still just opens the waitlist modal.
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

## Pricing

`/pricing` (`src/pages/pricing.astro` → `PricingCheckout.astro`) shows the three plans and
deep-links every card to `app.callmarta.com/register?plan=<key>` — **the landing sells
nothing**. Purchases happen inside the app (Stripe embedded checkout there; fulfillment via
the app's webhook). The homepage's pricing section (`src/components/Pricing.astro`) still
opens the waitlist modal instead.

Names, prices and result limits live in `src/lib/plans.ts` (`PLAN_REFS`) — the display
mirror of the app's operational catalog in `marta/app/domain/plans.py`; tier feature copy
sits in `src/lib/pricingCheckout.ts` and interpolates from it. Change a price in one place,
check the other repo.

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
