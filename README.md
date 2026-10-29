# Fourthwall

Astro website with a marketing homepage and blog routes. Built with TypeScript,
Tailwind CSS, and GSAP. Requires Node.js 22.12 or newer.

## Development

```sh
npm ci
npm run astro -- dev --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

`npm run build` creates the production output in `dist/`.
`npm run preview` previews that output locally.

The existing `/blog/[...slug]` route uses on-demand rendering (`prerender = false`).
Production builds currently require a deployment adapter, which is not configured.
Choose an adapter for the intended hosting platform before deployment; do not change
the route's rendering behavior merely to bypass this requirement.

## Source structure

```text
src/
├── pages/                   # URL entry points and page composition
│   ├── index.astro
│   └── blog/
│       ├── index.astro
│       └── [...slug]/index.astro
├── layouts/                 # Document shell, metadata, global styles
├── components/
│   ├── site/                # Header, navigation, footer, CTA, wordmark
│   ├── home/                # Homepage-specific cards, sliders, globe
│   │   └── sections/        # Homepage sections, including FAQ
│   ├── blog/                # Blog cards and newsletter
│   │   └── sections/        # Blog listing sections
│   ├── products/            # Product presentation components
│   ├── ui/                  # Reusable controls without page-specific content
│   └── icons/               # Astro SVG icons and their exports
├── data/
│   ├── site/                # Navigation, footer, and shared CTA content
│   ├── home/                # Homepage content and globe coordinates
│   └── products/            # Catalog and featured-product data
├── scripts/
│   ├── animations/          # Shared browser animation initializers
│   └── home/                # Homepage-specific browser behavior
├── styles/                  # Global CSS, design tokens, fonts, responsive rules
└── utils/                   # Environment-independent helpers such as cn()
public/                      # Static assets served at their existing URLs
```

## Organization conventions

- Keep routes in `src/pages/`; their file paths define public URLs. Compose page
  sections there and keep reusable presentation in `src/components/`.
- Put a component with its owning page or domain. Use `components/site/` for
  layout-wide content, `components/ui/` for generic controls, and `components/icons/`
  for icons. Promote a component to a shared location when it has shared consumers.
- Store static content in the matching `data/` domain. Import the specific module
  (for example, `@/data/site/nav`) so dependencies remain visible.
- Put browser initializers in `scripts/`, with shared animations separate from
  page-specific behavior. Keep component-local scripts and scoped styles beside
  their markup when they are only used there. Keep pure helpers in `utils/`.
- Use the existing `@/` alias for imports across directories. Small public exports
  for icons and utilities are retained; avoid a global barrel for unrelated data
  or browser scripts.
- Keep global styling in `styles/global.css` and preserve public asset paths.
  Avoid coupling CSS selectors to filesystem locations.
- Use kebab-case filenames, PascalCase component bindings, and descriptive names
  such as `home/sections/faq.astro` versus the generic `ui/accordion.astro`.
- Add new domains only when there is actual content or behavior to organize;
  avoid empty placeholder folders.

See the Astro guides for [components](https://docs.astro.build/en/basics/astro-components/),
[routing](https://docs.astro.build/en/guides/routing/), and
[styling](https://docs.astro.build/en/guides/styling/).

## Sanity blog

The blog uses the official [`@sanity/astro`](https://www.sanity.io/docs/astro/configure-sanity-astro) integration and Sanity-maintained `@portabletext/astro`. Existing Astro layouts, typography, cards, author/sidebar layout, and FAQ accordion are reused. No React is shipped to the blog; React is a dependency of the standalone editing Studio only.

### First-time setup

1. Create a project and a **production** dataset at [Sanity Manage](https://sanity.io/manage). A public dataset needs no API token for published content. Do not store confidential content in a public dataset.
2. Copy `.env.example` to `.env`. Set `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`, and `SITE_URL` (your canonical production origin for deployment). `BLOG_POSTS_PER_PAGE` defaults to 6 and accepts 1–48. Public configuration is read at build time; rebuild after changing it.
3. Copy `studio/.env.example` to `studio/.env` and set the same project ID and dataset using the `SANITY_STUDIO_*` names.
4. Run `npm run studio:dev`, sign in, and open the Studio URL it prints. Add that origin to the project's API → CORS origins if prompted. Only Studio needs browser CORS access; the website queries Sanity on the server.
5. Create and publish authors, categories, tags, and posts. Posts require a unique lowercase hyphenated slug, title, excerpt, image with alternative text, author, publication date, and body. Optional fields include featured status, summary, tags, categories, and FAQs. Publish referenced documents as well. Future-dated posts and drafts are excluded from every public query.
6. Start Astro with `npm run dev -- --background`. Manage it with `npm run astro -- dev status`, `npm run astro -- dev logs`, and `npm run astro -- dev stop`.

Until a real project is configured, `/blog` intentionally responds with a friendly 503/retry state; no sample posts are substituted. Missing or invalid article slugs return 404. A Sanity outage returns 503, not a misleading 404.

For a **private dataset**, create a read-only Viewer token. Set `SANITY_API_READ_TOKEN` in your local `.env` and in Cloudflare's runtime secrets (`npx wrangler secret put SANITY_API_READ_TOKEN`) for deployment. The token is resolved through `astro:env/server` at request time, never passed into the integration's browser client or a `PUBLIC_` variable. CDN reads are disabled for authenticated access. Environment files and Wrangler local secret files are ignored by Git.

Build the editor with `npm run studio:build`. To host it on Sanity, run `npx sanity deploy` from `studio/` after selecting your desired Studio hostname. Hosting the Studio is separate from deploying the Astro site; do not place an API token in Studio settings.

### Rendering and interaction

- `/blog` and `/blog/[slug]` render on demand using the existing Cloudflare adapter; the home page retains its static behavior. Published changes require no website rebuild. Public reads use Sanity's CDN, so newly published edits can take a short time to appear.
- Queries, types, input normalization, image helpers, and data access live in `src/lib/sanity/`. Studio schemas live in `studio/schemaTypes/`. GROQ values are parameterized. Listing queries return only one page of summaries, not entire article bodies.
- Initial requests contain complete server-rendered content for SEO and work without JavaScript. There is no client-side initial data request. Navigation to the blog or an article shows a delayed skeleton while the server responds. Direct browser loads use normal browser loading until server HTML arrives.
- The listing reuses the existing animated category pills, search field, card grid, and numbered pagination. Category breadcrumbs preselect their tab on direct loads and refreshes; browser history restores the same state. Featured matches either the featured flag or a featured category. Unknown category values fall back to Latest and page 1. Category links and pagination remain usable without JavaScript.
- Search debounces for 300 ms and searches title, excerpt, author, and body using Sanity's token/prefix matching. Category and tag filters combine with search before pagination. Controls reset to page 1; invalid/out-of-range pages are normalized. All state is represented in the URL.
- Progressive enhancement requests an HTML results fragment from the same route. It cancels in-flight requests, ignores stale completions, keeps previous results on failure, provides retry, and stores up to 20 pages for 60 seconds in a per-tab cache. Browser back/forward restores controls and results. Repeated pagination uses cached results. No hydration framework is required.
- Results updates use reserved-height skeletons and live announcements. Filtered/search listings are `noindex`; article pages have canonical URLs, social metadata, and BlogPosting JSON-LD. Images use Sanity CDN transforms, explicit dimensions, and lazy loading except the primary image.
- Related posts prioritize shared categories/tags, then recent posts. Failed recommendation requests do not hide an otherwise valid article. FAQs and summaries appear only when provided in Sanity. Rich-text links reject unsafe protocols.
- Server errors are not cached. Configure monitoring/rate limiting at the deployment edge for your expected traffic. The browser result cache intentionally trades up to 60 seconds of freshness for fewer requests.

### Validation

- `npm run check` — Astro and TypeScript diagnostics.
- `npm run test:browser` — browser checks against the background dev server (default `http://localhost:4322`; override with `BLOG_TEST_URL`). Tests cover URL history, debouncing, cancellation, cache reuse, retry, and reset, using isolated response fixtures. Requires Google Chrome.
- `npm test` — URL normalization and actual GROQ evaluation against an isolated test dataset (publication rules, search/filter combinations, pagination, taxonomy, detail lookups, recommendations).
- `npm run build` — production build.
- `npm run studio:build` — Studio build after configuration.

A live Sanity project is still needed to verify permissions, publication workflow, and production connectivity. Test content lives only in automated tests and is never served by the application.

Dependency audit: compatible fixes were applied, but npm still reports upstream advisories in Sanity CLI and Cloudflare tooling (17 total, including 3 high). The suggested automatic fixes require major downgrades, so they were not applied. Review upstream patched releases before deployment.
