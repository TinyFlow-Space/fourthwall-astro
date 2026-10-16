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
