## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Pricing & the app

The landing sells nothing. `/pricing` cards deep-link to
`app.callmarta.com/register?plan=<key>`; purchases happen inside the app
(Stripe embedded checkout + webhook fulfillment live in the `marta` repo).
The homepage's pricing section opens the waitlist modal instead — two
different CTAs on purpose. Names/prices/limits live in `src/lib/plans.ts`,
the display mirror of `marta/app/domain/plans.py` — change one, check the
other.
