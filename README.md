# marta-landing

Marketing site + blog for Marta (`callmarta.com`). Static Astro site, ported from the
[Claude Design](https://claude.ai/design) mockup, intended to deploy to Cloudflare Pages.
The app itself lives in the sibling `marta/` repo — this project has no backend of its own.

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`       | Start the dev server at `localhost:4321`    |
| `npm run build`     | Build the static site to `./dist/`          |
| `npm run preview`   | Preview the production build locally        |

## Structure

- `src/pages/index.astro` — landing page, assembled from `src/components/*`
- `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro` — blog list/post, backed by the
  `blog` content collection at `src/content/blog/*.md` (schema in `src/content.config.ts`)
- `src/scripts/landing.ts` — all of the landing page's interactivity (hero call-status
  animation, waveform demo player, EN/ES toggle, FAQ accordion, waitlist modal). Loaded only
  on the home page.
- `src/styles/global.css` — design tokens (colors, fonts, shared button/link states) shared by
  every page.

## Waitlist form

The design never wired the waitlist form to a real backend (it just simulates success after a
delay). This port keeps that behavior by default. To connect a real endpoint later, set
`PUBLIC_WAITLIST_ENDPOINT` (see `.env.example`) to a CORS-enabled URL that accepts
`POST { email }`. The `marta/` backend does not have a waitlist endpoint yet — see
`app/api/routers/` there for the pattern to follow (e.g. `app/api/routers/waitlist.py`,
registered in `app/main.py`), plus a `CORSMiddleware` entry allowing `https://callmarta.com`.

## Deploying to Cloudflare Pages (manual steps — not done yet)

This repo is static (`astro build` → `dist/`, no adapter needed) and Pages-ready, but connecting
the actual Cloudflare account and domain needs to happen from your Cloudflare dashboard/CLI:

1. **Push this repo to GitHub** (see below), then in the Cloudflare dashboard: **Workers & Pages
   → Create → Pages → Connect to Git**, select `marta-landing`.
2. Build settings: build command `npm run build`, build output directory `dist`, no framework
   preset needed (or pick "Astro" if offered).
3. Once deployed, go to the Pages project's **Custom domains** tab and add `callmarta.com` (and
   `www.callmarta.com` if you want the redirect). If the domain is already on this Cloudflare
   account, DNS records are added automatically; otherwise point the registrar's nameservers at
   Cloudflare first.
4. Optional: `PUBLIC_WAITLIST_ENDPOINT` (and any future env vars) go in the Pages project's
   **Settings → Environment variables**, not in a committed `.env`.

Alternatively, once you've run `wrangler login`, `npm run build && npx wrangler pages deploy dist`
deploys directly using the `wrangler.toml` in this repo.
