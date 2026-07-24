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

## Waitlist form

The design never wired the waitlist form to a real backend (it just simulates success after a
delay). This port keeps that behavior by default. To connect a real endpoint later, set
`PUBLIC_WAITLIST_ENDPOINT` (see `.env.example`) to a CORS-enabled URL that accepts
`POST { email }`. The `marta/` backend does not have a waitlist endpoint yet — see
`app/api/routers/` there for the pattern to follow (e.g. `app/api/routers/waitlist.py`,
registered in `app/main.py`), plus a `CORSMiddleware` entry allowing `https://callmarta.com`.

## Deploying to Cloudflare Pages

Connected via the Cloudflare dashboard's Git integration (**Workers & Pages → Create → Pages →
Connect to Git**, repo `rocket-hen/marta-landing`) — every push to `main` auto-builds and deploys.

- Build command: `npm run build`
- Build output directory: `dist`
- No framework preset / adapter needed — this is a fully static site.

Don't add a `wrangler.toml` back for this project: its presence makes Cloudflare's Git-integration
builder run a Wrangler-driven deploy step instead of its normal Pages asset upload, which fails in
CI without extra Cloudflare API credentials configured. It's only relevant for a manual
`wrangler pages deploy dist` CLI workflow, which this repo doesn't use.

Custom domain: add `callmarta.com` (and `www.callmarta.com` for the redirect) under the Pages
project's **Custom domains** tab. If the domain's already on this Cloudflare account, DNS records
are added automatically; otherwise point the registrar's nameservers at Cloudflare first.

Env vars (e.g. `PUBLIC_WAITLIST_ENDPOINT`, see `.env.example`) go in the Pages project's
**Settings → Environment variables**, not in a committed `.env`.
