import {
  stegaClean,
  stegaEncodeSourceMap,
  type ContentSourceMap,
  type InitializedStegaConfig,
} from "@sanity/client/stega";
export { stegaClean };

// Enable locally, or explicitly on a deployed editing environment.
export const visualEditingEnabled =
  import.meta.env?.DEV ||
  import.meta.env?.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === "true";
// These strings drive behavior, URLs, or presentation rather than visible copy.
export const isTechnicalField = (field: string) =>
  /^(?:_.*|slug|href|url|src|.*Url|.*Href|.*Src|formAction|canonicalUrl|html|style|styles|type|menuKind|status|key|id|icon|className|class|size|variant|color|hex|background|gradient|position|category|publishedAt|updatedAt|effectiveDate|audioDuration|siteName|siteDescription|ariaLabel.*)$/i.test(
    field,
  );
export function cleanTechnicalContent<T>(value: T, field = ""): T {
  if (typeof value === "string")
    return (isTechnicalField(field) ? stegaClean(value) : value) as T;
  if (Array.isArray(value))
    return value.map((item) => cleanTechnicalContent(item, field)) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        cleanTechnicalContent(item, key),
      ]),
    ) as T;
  return value;
}

/** Keep fetched content published, but open its editable draft counterpart in Studio. */
export function encodeDraftEditLinks<T>(
  result: T,
  sourceMap: ContentSourceMap | undefined,
  config: InitializedStegaConfig,
): T {
  const editSourceMap = sourceMap && {
    ...sourceMap,
    documents: sourceMap.documents.map((document) => ({
      ...document,
      // Sanity adds perspective=published for published IDs. Draft IDs retain
      // the same document/field target without forcing Studio's read-only view.
      _id: /^(drafts|versions)\./.test(document._id)
        ? document._id
        : `drafts.${document._id}`,
    })),
  };
  return stegaEncodeSourceMap(result, editSourceMap, config);
}
