import { getSecret } from "astro:env/server";
import type { AstroCookies } from "astro";

/**
 * Draft preview for the Studio's Presentation tool.
 *
 * Presentation opens `/api/draft-mode/enable` with a one-time secret. Once that
 * secret is validated against Sanity, the site sets a signed, expiring cookie;
 * requests carrying a valid cookie read drafts (with stega + overlays).
 * The signature uses the server-only read token, so the cookie cannot be forged.
 */
export const PREVIEW_COOKIE = "fw-sanity-preview";
const MAX_AGE_SECONDS = 60 * 60 * 8;

export const readToken = () => getSecret("SANITY_API_READ_TOKEN") || "";

async function sign(value: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(`fourthwall-preview:${value}`),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time comparison of two hex strings.
function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const cookieOptions = (secure: boolean) => ({
  path: "/",
  httpOnly: true,
  // Presentation renders the site in a cross-site iframe.
  sameSite: "none" as const,
  secure,
  // The hosted Studio (sanity.io) and the site are different sites, so the
  // cookie lives in a third-party iframe; partitioned cookies are allowed there.
  partitioned: secure,
});

export async function startPreview(cookies: AstroCookies, url: URL) {
  const token = readToken();
  if (!token) throw new Error("SANITY_API_READ_TOKEN is required for previews");
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  cookies.set(PREVIEW_COOKIE, `${expires}.${await sign(String(expires), token)}`, {
    ...cookieOptions(url.protocol === "https:" || url.hostname === "localhost"),
    maxAge: MAX_AGE_SECONDS,
  });
}

export function stopPreview(cookies: AstroCookies, url: URL) {
  cookies.delete(PREVIEW_COOKIE, cookieOptions(url.protocol === "https:" || url.hostname === "localhost"));
}

export async function isPreview(cookies: AstroCookies): Promise<boolean> {
  const value = cookies.get(PREVIEW_COOKIE)?.value;
  const token = readToken();
  if (!value || !token) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) * 1000 < Date.now()) return false;
  return equal(signature, await sign(expires, token));
}
