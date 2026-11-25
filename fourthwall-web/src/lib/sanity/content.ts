import { stegaClean } from "@sanity/client/stega";
import defaults from "../../data/cms-defaults.json" with { type: "json" };
import { imageUrl, safeHref } from "./presentation.ts";
import { sanityDataset, sanityProjectId } from "./config.ts";
import type { SanityImage } from "./types";
import type { FAQS } from "@/data/home/faqs";
import type { FeaturedProduct } from "@/data/products/featured-products";
import type { CATALOG_PRODUCTS } from "@/data/products/catalog-products";
export type Seo = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string | SanityImage;
  canonicalUrl?: string;
  noIndex?: boolean;
};
export type CatalogProduct = (typeof CATALOG_PRODUCTS)[number] & {
  category?: string;
  bestseller?: boolean;
  _id?: string;
};
/**
 * One item of the Homepage "Page sections" array (render order): a built-in
 * section marker, or a builder "section" with nested blocks (raw CMS data;
 * see components/builder).
 */
export interface PageSection {
  _key: string;
  _type: string;
  hidden?: boolean;
  [field: string]: unknown;
}
export type SiteContent = Omit<typeof defaults, "homePage"> & {
  homePage: Omit<typeof defaults.homePage, "collections"> & {
    /** Empty until sections are added in the CMS; the default order is used then. */
    pageBuilder: PageSection[];
    collections: Omit<
      typeof defaults.homePage.collections,
      "FAQS" | "FEATURED_PRODUCTS" | "CATALOG_PRODUCTS"
    > & {
      FAQS: typeof FAQS;
      FEATURED_PRODUCTS: FeaturedProduct[];
      CATALOG_PRODUCTS: CatalogProduct[];
    };
  };
  productCategories: { title: string; slug: string }[];
};
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
/** Normalize CMS media and editor-friendly array wrappers into component data. */
export function normalizeContent(value: unknown, fieldName = ""): unknown {
  if (
    typeof value === "string" &&
    /^(href|url|formAction|canonicalUrl)/i.test(fieldName) &&
    value &&
    !safeHref(value)
  )
    return undefined;
  if (Array.isArray(value))
    return value.map((item) => normalizeContent(item, fieldName));
  if (!record(value)) return value;
  if (value._type === "managedMedia") {
    const image = value.image as SanityImage | undefined;
    if (image?.asset?._ref) return imageUrl(image, 1600);
    const file = value.file as { asset?: { _ref?: string } } | undefined;
    if (file?.asset?._ref) {
      const match = /^file-(.+)-([a-z0-9]+)$/.exec(file.asset._ref);
      if (match)
        return `https://cdn.sanity.io/files/${sanityProjectId}/${sanityDataset}/${match[1]}.${match[2]}`;
    }
    return typeof value.url === "string" && safeHref(value.url)
      ? stegaClean(value.url)
      : undefined;
  }
  if ("plainText" in value && typeof value.plainText === "string")
    return value.plainText;
  if ("listItems" in value) return normalizeContent(value.listItems);
  return Object.fromEntries(
    Object.entries(value)
      // `_key` is kept so list items can be canvas-editing targets.
      .filter(([k]) => k === "_key" || !k.startsWith("_"))
      .map(([k, v]) => [k, normalizeContent(v, k)]),
  );
}
/** Missing values fall back; explicit empty arrays remain editorial removals. */
export function mergeContent<T>(fallback: T, value: unknown): T {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) return fallback;
    return value.map((item, index) =>
      mergeContent(fallback[index] ?? fallback[0], item),
    ) as T;
  }
  if (record(fallback)) {
    if (!record(value)) return fallback;
    return Object.fromEntries(
      [...new Set([...Object.keys(fallback), ...Object.keys(value)])].map(
        (k) => [k, mergeContent(fallback[k], value[k])],
      ),
    ) as T;
  }
  return (
    fallback !== undefined && typeof fallback !== typeof value
      ? fallback
      : value
  ) as T;
}
const initialCategories = [
  { title: "Apparel", slug: "apparel" },
  { title: "Accessories", slug: "accessories" },
  { title: "Drinkware", slug: "drinkware" },
  { title: "Home & Living", slug: "home-living" },
];
export function fallbackContent(): SiteContent {
  const result = structuredClone(defaults) as unknown as SiteContent;
  result.productCategories = initialCategories;
  result.homePage.pageBuilder = [];
  result.homePage.collections.CATALOG_PRODUCTS =
    result.homePage.collections.CATALOG_PRODUCTS.map((p) => ({
      ...p,
      bestseller: true,
      category: /mug|bottle/i.test(p.name)
        ? "drinkware"
        : /sticker|hat/i.test(p.name)
          ? "accessories"
          : "apparel",
    }));
  return result;
}
/** Keep `_key`/`_type` (dropped by normalizeContent) for canvas editing. */
function pageSections(value: unknown): PageSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> & { _key: string; _type: string } =>
        record(item) &&
        typeof item._key === "string" &&
        typeof item._type === "string",
    )
    .map((item) =>
      // Builder sections keep their raw shape: nested `_key`s drive canvas
      // editing and `asset._ref`s drive images. Stega is stripped so each block
      // gets one block-level overlay instead of one per word.
      item._type === "section"
        ? (stegaClean(item) as PageSection)
        : {
            _key: stegaClean(item._key),
            _type: stegaClean(item._type),
            hidden: item.hidden === true,
          },
    );
}
export function mapSiteContent(raw: Record<string, unknown>): SiteContent {
  const result = mergeContent(fallbackContent(), normalizeContent(raw));
  result.homePage.pageBuilder = pageSections(
    record(raw.homePage) ? raw.homePage.pageBuilder : undefined,
  );
  // Keep decorative motion geometry and brand size tokens in frontend code.
  result.homePage.collections.HERO_SLIDERS =
    result.homePage.collections.HERO_SLIDERS.filter(
      (slide) => (slide as { enabled?: boolean }).enabled !== false,
    );
  result.siteSettings.collections.ORBIT_RINGS =
    result.siteSettings.collections.ORBIT_RINGS.map((ring, i) => ({
      ...defaults.siteSettings.collections.ORBIT_RINGS[
        i % defaults.siteSettings.collections.ORBIT_RINGS.length
      ],
      images: ring.images,
    }));
  for (const key of [
    "BRAND_MARQUEE_DATA",
    "MGF_IMAGES",
    "MGF_PRODUCTS",
    "WALL_SHOPS",
    "DESIGN_MOCKUPS",
  ] as const) {
    if (!result.homePage.collections[key].length)
      Object.assign(result.homePage.collections, {
        [key]: defaults.homePage.collections[key],
      });
  }
  const groups = result.footer.collections.FOOTER_LINKS.filter(
    (g) => stegaClean(g.title) !== "Elsewhere",
  );
  const socials = result.siteSettings.socialLinks
    .filter((l) => l.enabled !== false && safeHref(l.url))
    .map(({ name, url }) => ({ name, url }));
  result.footer.collections.FOOTER_LINKS = [
    ...groups,
    ...(socials.length ? [{ title: "Elsewhere", links: socials }] : []),
  ];
  return result;
}
export const contentFor = (locals: { cms?: SiteContent }): SiteContent =>
  locals.cms ?? fallbackContent();
