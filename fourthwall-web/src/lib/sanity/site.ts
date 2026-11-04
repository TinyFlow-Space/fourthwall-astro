import { query } from "./client";
import { siteContentQuery } from "./queries/site";
import {
  fallbackContent,
  mapSiteContent,
  normalizeContent,
  type CatalogProduct,
} from "./content";
interface ProductDocument extends Partial<CatalogProduct> {
  title?: string;
  enabled?: boolean;
  catalog?: boolean;
  featured?: boolean;
  featuredOrder?: number;
  featuredImage?: string;
  hoverSrc?: string;
  featuredHref?: string;
}
export async function getSiteContent(home: boolean) {
  try {
    const raw = await query<Record<string, unknown>>(siteContentQuery, {
      home,
    });
    const result = mapSiteContent(raw);
    if (home && Array.isArray(raw.products) && raw.products.length) {
      const products = normalizeContent(raw.products) as ProductDocument[];
      const valid = products.filter((p) => p.title && p.src && p.href);
      result.homePage.collections.CATALOG_PRODUCTS = valid
        .filter((p) => p.catalog !== false)
        .map((p) => ({
          name: p.title!,
          src: p.src!,
          href: p.href!,
          price: p.price ?? "",
          rating: p.rating ?? 0,
          reviews: p.reviews ?? 0,
          colorCount: p.colorCount ?? 0,
          colors: p.colors ?? [],
          tech: p.tech ?? [],
          badges: p.badges ?? [],
          category: p.category,
          bestseller: p.bestseller,
        }));
      result.homePage.collections.FEATURED_PRODUCTS = valid
        .filter((p) => p.featured)
        .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
        .slice(0, 6)
        .map((p) => ({
          name: p.title!,
          src: p.featuredImage || p.src!,
          hoverSrc: p.hoverSrc || undefined,
          href: p.featuredHref || p.href!,
          rating: String(p.rating ?? 0),
        }));
    } else if (home && raw.homePage && Array.isArray(raw.products)) {
      result.homePage.collections.CATALOG_PRODUCTS = [];
      result.homePage.collections.FEATURED_PRODUCTS = [];
    }
    return result;
  } catch (error) {
    console.warn("CMS content unavailable; using existing site content.");
    return fallbackContent();
  }
}
