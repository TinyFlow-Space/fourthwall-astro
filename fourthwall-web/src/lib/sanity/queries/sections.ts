// Shape image objects for the shared managed-media normalizer while preserving
// source mappings for editable text. Both variant payloads are kept in the result.
const background = `background{..., "image": {"_type": "managedMedia", "image": image}}`;
export const heroVariantsProjection = `"heroVariants": heroVariants{
  ...,
  slider{..., ${background}},
  static{..., "imageAlt": image.alt, "image": {"_type": "managedMedia", "image": image}, ${background}}
}`;
