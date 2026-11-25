import { createDataAttribute } from "@sanity/visual-editing/create-data-attribute";
import { sanityDataset, sanityProjectId, sanityStudioUrl } from "./sanity/config.ts";
import type { SanityImage } from "./sanity/types";

/** A block from a builder Section (raw CMS data; stega already stripped). */
export interface Block {
  _key: string;
  _type: string;
  [field: string]: unknown;
}
export type BuilderImage = SanityImage & { alt?: string };

/** Where blocks live in the document, for click/drag/context-menu targets. */
export interface EditContext {
  editing: boolean;
  documentId: string;
  documentType: string;
}

export const keyed = (path: string, key: string) => `${path}[_key=="${key}"]`;

export function editAttribute(ctx: EditContext, path: string): string | undefined {
  if (!ctx.editing) return undefined;
  return createDataAttribute({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    baseUrl: sanityStudioUrl,
    id: ctx.documentId,
    type: ctx.documentType,
    path,
  }).toString();
}

export const blocks = (value: unknown): Block[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Block =>
          !!item &&
          typeof item === "object" &&
          typeof (item as Block)._key === "string" &&
          typeof (item as Block)._type === "string",
      )
    : [];

export const str = (value: unknown, fallback = "") =>
  typeof value === "string" && value ? value : fallback;
export const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const SPACE: Record<string, string> = {
  none: "0px",
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "40px",
  "2xl": "64px",
};
export const space = (value: unknown) => SPACE[str(value, "none")] ?? "0px";

/** Inline-margin variables used by max-width blocks; "auto" inherits. */
export function alignClass(value: unknown): string | undefined {
  const align = str(value, "auto");
  return align === "auto" ? undefined : `pb-align-${align}`;
}

/** "16/9" → 1.777…; "auto" → undefined. */
export function ratio(value: unknown): number | undefined {
  const match = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(str(value, "auto"));
  return match ? Number(match[1]) / Number(match[2]) : undefined;
}

/** CSS object-position from the image hotspot, so crops keep the focal point. */
export function focalPoint(image?: BuilderImage): string | undefined {
  const hotspot = image?.hotspot;
  return hotspot
    ? `${Math.round(hotspot.x * 100)}% ${Math.round(hotspot.y * 100)}%`
    : undefined;
}

/** Sanity file asset ref (`file-<id>-<ext>`) → CDN URL. */
export function fileUrl(file: unknown): string | undefined {
  const ref = (file as { asset?: { _ref?: string } } | undefined)?.asset?._ref;
  const match = ref ? /^file-([a-zA-Z0-9]+)-([a-z0-9]+)$/.exec(ref) : null;
  return match
    ? `https://cdn.sanity.io/files/${sanityProjectId}/${sanityDataset}/${match[1]}.${match[2]}`
    : undefined;
}

/** Portable Text → plain text (labels, empty checks). */
export function plainText(value: unknown): string {
  if (!Array.isArray(value)) return typeof value === "string" ? value : "";
  return value
    .map((block: { children?: { text?: unknown }[] }) =>
      (block?.children ?? [])
        .map((child) => (typeof child?.text === "string" ? child.text : ""))
        .join(""),
    )
    .join(" ")
    .trim();
}
