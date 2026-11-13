import { stegaClean } from "@sanity/client/stega";

/** Resolve only registered variants; old documents and unknown IDs use the default. */
export function resolveVariantId<M extends Record<string, unknown>>(
  value: unknown,
  variants: M,
  fallback: keyof M,
): keyof M {
  const key = typeof value === "string" ? stegaClean(value) : "";
  return Object.prototype.hasOwnProperty.call(variants, key)
    ? (key as keyof M)
    : fallback;
}
