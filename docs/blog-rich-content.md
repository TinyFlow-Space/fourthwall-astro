# Blog rich content

Existing text, images, headings, TOC, TL;DR, FAQs and related posts keep their existing schema names and rendering. No content migration is required. New optional blocks are added to the body menu.

## Editor blocks

- **Table**: caption, optional first header row, and rows of plain-text cells. All rows must have equal widths. Tables scroll horizontally and remain keyboard accessible.
- **Video embed / upload**: YouTube watch/share/shorts/embed URLs, Vimeo URLs, or one uploaded video. Uploaded videos support WebVTT captions and a language code. Give every video an accessible title. Provider-controlled captions remain in provider players.
- **Instagram / Spotify embed**: public Instagram posts, reels and carousels, or Spotify tracks/albums/playlists/episodes/shows. Providers render carousel controls. The original-content link remains available if embeds are blocked or unavailable.
- **HTML embed**: HTML in a sandboxed frame; inline scripts and event handlers are blocked.
- **Embed script**: HTML plus one trusted HTTPS script URL. External code runs only inside an opaque-origin frame, without parent DOM, cookies/storage, forms, popups or top-level navigation access. CSP permits scripts from the configured script origin only. Providers requiring additional script origins, storage or inline initialization may not work; use a supported provider block or link instead. Do not paste secrets into embed HTML: CMS body content is public.

Frames have editor-configurable heights (160–1600px) and internal scrolling to avoid trusting cross-origin resize messages. They fill the article column on mobile. Each isolated document initializes itself when loaded, including after Astro client navigation; there is no parent-page embed scanner or global third-party script. Browsers lazy-load frames, and articles without embeds request no third-party embed scripts.

## Reference analysis

The [reference Fourthwall article](https://fourthwall.com/blog/rhett-and-link-creator-spotlight) uses Instagram blockquote markup initialized by `instagram.com/embed.js`, and YouTube iframes inside responsive rich-text figures. No table was present in the inspected HTML. This implementation provides reusable, isolated rich-content provider frames without copying the reference content.

Implementation references: [Sanity assets](https://www.sanity.io/docs/content-lake/assets), [Sanity array schema](https://www.sanity.io/docs/studio/array-type), [Astro components](https://docs.astro.build/en/basics/astro-components/), [Astro styling](https://docs.astro.build/en/guides/styling/).
