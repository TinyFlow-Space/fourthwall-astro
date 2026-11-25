import { editAttribute, keyed, type EditContext } from "./builder.ts";
import { visualEditingEnabled } from "./sanity/stega.ts";

/**
 * Canvas editing markers (rendered only while editing in Presentation):
 *
 * - An **item** is a movable array member: `data-fw-item` (its path),
 *   `data-fw-parent` (the array it lives in) and `data-fw-type`.
 * - A **slot** is an array that accepts items: `data-fw-slot` (the array path)
 *   and `data-fw-accepts` (space-separated item types).
 *
 * The canvas tools script (scripts/builder/canvas.ts) reads only these
 * attributes to drag items between slots and to insert new ones.
 */
type Attrs = Record<string, string | undefined>;

/** Item types each builder array accepts. Mirrors the CMS schema. */
const TEXT = ["eyebrow", "heading", "paragraph", "button", "buttonGroup"];
const MEDIA = ["imageBlock", "loopingVideo"];
export const ACCEPTS = {
  // Same order as the Studio's "Add item" menu for Page sections.
  pageBuilder: [
    "homeHero",
    "homeFeaturedProducts",
    "homeTrustedBrands",
    "homeBrandShowcase",
    "homeProductDesign",
    "homeOperations",
    "homeTestimonials",
    "homeProducts",
    "homeCreators",
    "homeMadeWith",
    "homeFaq",
    "section",
  ],
  section: [...TEXT, ...MEDIA, "card", "grid", "slider"],
  card: [...TEXT, ...MEDIA],
  grid: ["card", ...MEDIA, ...TEXT],
  slider: ["card", ...MEDIA],
  buttonGroup: ["groupButton"],
} as const;

export function homeContext(locals: { preview?: boolean }): EditContext {
  return {
    editing: !!locals.preview || visualEditingEnabled,
    documentId: "homePage",
    documentType: "homePage",
  };
}

export function itemAttrs(
  ctx: EditContext,
  arrayPath: string,
  key: unknown,
  type: string,
): Attrs {
  if (!ctx.editing || typeof key !== "string" || !key) return {};
  const path = keyed(arrayPath, key);
  return {
    "data-sanity": editAttribute(ctx, path),
    "data-fw-item": path,
    "data-fw-parent": arrayPath,
    "data-fw-type": type,
    "data-fw-doc": ctx.documentId,
  };
}

export function slotAttrs(
  ctx: EditContext,
  arrayPath: string,
  accepts: readonly string[],
): Attrs {
  if (!ctx.editing) return {};
  return {
    "data-fw-slot": arrayPath,
    "data-fw-accepts": accepts.join(" "),
    "data-fw-doc": ctx.documentId,
  };
}

/**
 * Homepage lists ("Images and lists"). Items of one list share a list-specific
 * type, so they can be reordered within their list but never dropped into
 * another list (or a builder section) with a different shape.
 */
const listType = (name: string) => `cmsItem:${name}`;
export const listSlot = (ctx: EditContext, name: string) =>
  slotAttrs(ctx, `collections.${name}`, [listType(name)]);
export const listItem = (ctx: EditContext, name: string, item: unknown) =>
  itemAttrs(ctx, `collections.${name}`, (item as { _key?: unknown })?._key, listType(name));
