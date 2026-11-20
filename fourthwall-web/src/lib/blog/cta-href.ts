export const DEFAULT_CTA_URL = "https://fourthwall.com/get-started/";

/**
 * Add blog UTM parameters to the CTA URL. Parameters already present in the
 * CMS URL win, so editors can override any of them.
 */
export function ctaHref(url: string | undefined, slug: string): string {
  let target: URL;
  try {
    target = new URL(url?.trim() || DEFAULT_CTA_URL);
    if (target.protocol !== "https:" && target.protocol !== "http:")
      throw new Error("unsupported protocol");
  } catch {
    target = new URL(DEFAULT_CTA_URL);
  }
  const utm = { utm_source: "blog", utm_medium: "post", utm_campaign: slug };
  for (const [key, value] of Object.entries(utm))
    if (value && !target.searchParams.has(key))
      target.searchParams.set(key, value);
  return target.href;
}
