import type { APIRoute } from "astro";
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { sanityClient } from "@/lib/sanity/client";
import { readToken, startPreview } from "@/lib/sanity/preview";

export const prerender = false;

/** Opened by the Studio's Presentation tool with a one-time preview secret. */
export const GET: APIRoute = async ({ request, cookies, redirect, url }) => {
  if (!readToken())
    return new Response("Draft preview needs SANITY_API_READ_TOKEN.", {
      status: 500,
    });
  const { isValid, redirectTo = "/" } = await validatePreviewUrl(
    sanityClient(),
    request.url,
  );
  if (!isValid) return new Response("Invalid preview secret.", { status: 401 });
  await startPreview(cookies, url);
  // Only same-site paths; never follow an absolute or protocol-relative URL.
  const target = /^\/(?!\/)/.test(redirectTo) ? redirectTo : "/";
  return redirect(target, 307);
};
