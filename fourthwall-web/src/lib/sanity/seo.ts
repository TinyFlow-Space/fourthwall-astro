import type { Seo } from "./content";
import { imageUrl, safeHref } from "./presentation.ts";
export function resolveSeo(
  page: Seo | undefined,
  site: Seo,
  fallback: {
    title: string;
    description: string;
    image?: string;
    canonicalUrl?: string;
    noindex?: boolean;
  },
) {
  const og = page?.ogImage || site.ogImage;
  return {
    title: page?.metaTitle || site.metaTitle || fallback.title,
    description:
      page?.metaDescription || site.metaDescription || fallback.description,
    image:
      (typeof og === "string" ? safeHref(og) : imageUrl(og, 1200, 630)) ||
      fallback.image ||
      "/og.png",
    canonicalUrl: safeHref(page?.canonicalUrl) || fallback.canonicalUrl,
    noindex: !!(page?.noIndex || site.noIndex || fallback.noindex),
  };
}
