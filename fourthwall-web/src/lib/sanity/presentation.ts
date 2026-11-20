import { stegaClean } from "@sanity/client/stega";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImage } from "./types";
import { sanityDataset, sanityProjectId } from "./config.ts";
const builder = createImageUrlBuilder({
  projectId: sanityProjectId,
  dataset: sanityDataset,
});
export function imageUrl(
  image: SanityImage | undefined,
  width = 800,
  height?: number,
): string | undefined {
  if (!image?.asset?._ref) return undefined;
  try {
    let url = builder.image(stegaClean(image)).width(width).auto("format").fit("crop");
    if (height) url = url.height(height);
    return url.url();
  } catch {
    return undefined;
  }
}
export const postHref = (slug: string) => `/blog/${encodeURIComponent(stegaClean(slug))}`;
export const formatDate = (date: string) =>
  !date || Number.isNaN(new Date(stegaClean(date)).getTime()) ? "Unpublished" : new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(stegaClean(date)));
export function safeHref(value?: string): string | undefined {
  if (!value) return undefined;
  value = stegaClean(value);
  if (/^\/(?!\/)/.test(value) || value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}
export { getHeadings, headingId } from "./headings.ts";
