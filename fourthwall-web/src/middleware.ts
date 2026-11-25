import { defineMiddleware } from "astro:middleware";
import { getSiteContent } from "./lib/sanity/site";
import { isPreview } from "./lib/sanity/preview";
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.preview = await isPreview(context.cookies);
  if (
    context.url.pathname === "/" ||
    /^\/blog(?:\/|$)/.test(context.url.pathname)
  )
    context.locals.cms = await getSiteContent(
      context.url.pathname === "/",
      context.locals.preview,
    );
  const response = await next();
  if (!context.locals.preview) return response;
  // Draft content must never be cached or shared. Some responses (redirects,
  // fetched assets) have immutable headers, so copy those before changing them.
  try {
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    const copy = new Response(response.body, response);
    copy.headers.set("Cache-Control", "private, no-store");
    return copy;
  }
});
