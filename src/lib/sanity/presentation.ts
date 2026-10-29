import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImage, BodyBlock } from "./types";
const builder = createImageUrlBuilder({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || "unconfigured",
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
});
export function imageUrl(
  image: SanityImage | undefined,
  width = 800,
  height?: number,
): string | undefined {
  if (!image?.asset?._ref) return undefined;
  try {
    let url = builder.image(image).width(width).auto("format").fit("crop");
    if (height) url = url.height(height);
    return url.url();
  } catch {
    return undefined;
  }
}
export const postHref = (slug: string) => `/blog/${encodeURIComponent(slug)}`;
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
export function safeHref(value?: string): string | undefined {
  if (!value) return undefined;
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
export const headingId = (key: string) =>
  `section-${key.replace(/[^a-zA-Z0-9_-]/g, "")}`;
export function getHeadings(body: BodyBlock[]) {
  return body.flatMap((block) =>
    block._type === "block" &&
    "children" in block &&
    (block.style === "h2" || block.style === "h3")
      ? [
          {
            depth: block.style === "h2" ? 2 : 3,
            slug: headingId(block._key ?? ""),
            text: block.children.map((child) => child.text).join(""),
          },
        ]
      : [],
  );
}
