# marta-landing

Marketing site + blog for Marta (`callmarta.com`). Static Astro site, ported from the
[Claude Design](https://claude.ai/design) mockup, intended to deploy to Cloudflare Pages.
The app itself lives in the sibling `marta/` repo — this project has no backend of its own.

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`       | Start the dev server at `localhost:4321` (**does not** run the `/api/waitlist` function — see below) |
| `npm run build`     | Build the static site to `./dist/`          |
| `npm run preview`   | Build, then serve via `wrangler pages dev` at `localhost:8788` — this is the only way to exercise `functions/api/waitlist.ts` locally |

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
- `functions/api/waitlist.ts` — the waitlist backend. A Cloudflare Pages Function (not part of
  the Astro build), so the site stays fully static while this one route runs server-side. See
  "Waitlist backend" below.

## Waitlist backend

The waitlist form (`src/components/WaitlistModal.astro`) POSTs JSON to `/api/waitlist`, a
Cloudflare Pages Function at `functions/api/waitlist.ts`. It upserts a contact in Resend with
the submitted qualification data, adds it to a waitlist segment, and sends a welcome email.
No Resend SDK — it's plain `fetch` against `api.resend.com`, since this runs on the Workers
runtime. The Resend API key never reaches the browser.

**This repo has no `wrangler.toml`, on purpose** — see the note in "Deploying to Cloudflare
Pages" below. That means local dev and production get their environment variables from two
different places:

### Local development

1. `cp .dev.vars.example .dev.vars` and fill in real (ideally sandbox/test) values.
   `.dev.vars` is gitignored — never commit it.
2. `astro dev` does **not** run Pages Functions. Use `npm run preview` instead — it builds the
   site and serves it via `wrangler pages dev dist`, which does run `functions/`, at
   `http://localhost:8788`.
3. Test the endpoint directly:
   ```
   curl -X POST http://localhost:8788/api/waitlist \
     -H 'content-type: application/json' \
     -d '{"email":"you@example.com","leadType":"Renting","city":"Valencia","moveTimeline":"ASAP","budget":"Under €800","pain":"","consent":true}'
   ```

### One-time Resend setup

Contact properties and segments must exist **before** the function can use them — sending an
undefined property key is silently dropped by Resend, not an error, and there's no "create if
missing" endpoint to call per-request. So this is a one-time setup step, done once via `curl`
(swap in a real `RESEND_API_KEY`):

```
# The waitlist segment — its id becomes RESEND_SEGMENT_ID
curl -X POST https://api.resend.com/segments \
  -H "Authorization: Bearer $RESEND_API_KEY" -H 'content-type: application/json' \
  -d '{"name":"Waitlist"}'

# One contact property per field the form collects (repeat with each key below)
curl -X POST https://api.resend.com/contact-properties \
  -H "Authorization: Bearer $RESEND_API_KEY" -H 'content-type: application/json' \
  -d '{"key":"lead_type","type":"string"}'
# ...and again for: city, move_timeline, budget, pain, consent_at, source
```

(All 7 properties are `type: "string"` — Resend only supports `string`/`number`, and
`consent_at` is stored as an ISO timestamp string.) This can equally be done from the Resend
dashboard if you'd rather click through it.

### Production environment variables

Cloudflare dashboard → Pages project → **Settings → Environment variables**:

| Variable | Value | Type |
| :-- | :-- | :-- |
| `RESEND_API_KEY` | from the Resend dashboard | **Secret** (not a plain variable) |
| `RESEND_SEGMENT_ID` | the id from the `POST /segments` call above | Variable |
| `MAIL_FROM` | e.g. `hello@callmarta.com` (must be a verified sending domain in Resend) | Variable |

### Optional: raw lead backup (KV)

If a KV namespace bound as `WAITLIST_KV` exists, the function also writes each raw submission
to it under `lead:<timestamp>:<email>` — a second copy of the lead list outside Resend. This is
optional; if the binding is absent the function silently skips that step. To add it: Cloudflare
dashboard → Workers & Pages → KV → create a namespace, then Pages project → **Settings →
Functions → KV namespace bindings** → add `WAITLIST_KV` pointing at it. (This is a dashboard
binding, not a `wrangler.toml` one, for the same reason described below.)

### Where to review leads

- **Resend dashboard** → Contacts → the waitlist segment — the primary, always-up-to-date view,
  with every property (`lead_type`, `city`, `move_timeline`, `budget`, `pain`, `consent_at`,
  `source`) visible per contact.
- **KV namespace** (if bound) — raw JSON per submission, useful as a backup or for bulk export;
  browse via Cloudflare dashboard → Workers & Pages → KV → the namespace, or `wrangler kv key list`.

## Deploying to Cloudflare Pages

Connected via the Cloudflare dashboard's Git integration (**Workers & Pages → Create → Pages →
Connect to Git**, repo `rocket-hen/marta-landing`) — every push to `main` auto-builds and deploys.

- Build command: `npm run build`
- Build output directory: `dist`
- No framework preset / adapter needed — this is a fully static site.

Don't add a `wrangler.toml` back for this project: its presence makes Cloudflare's Git-integration
builder run a Wrangler-driven deploy step instead of its normal Pages asset upload, which fails in
CI without extra Cloudflare API credentials configured. It's only relevant for a manual
`wrangler pages deploy dist` CLI workflow, which this repo doesn't use. This doesn't affect
`functions/` — Cloudflare's Git-integration build auto-detects and deploys Pages Functions from
that directory with no config file needed.

Custom domain: add `callmarta.com` (and `www.callmarta.com` for the redirect) under the Pages
project's **Custom domains** tab. If the domain's already on this Cloudflare account, DNS records
are added automatically; otherwise point the registrar's nameservers at Cloudflare first.

Env vars and the `WAITLIST_KV` binding go in the Pages project's **Settings** (Environment
variables / Functions → KV namespace bindings), not in a committed file — see "Waitlist backend"
above for the exact variables needed.
