import { defineMiddleware } from "astro:middleware";
import { getSiteContent } from "./lib/sanity/site";
export const onRequest = defineMiddleware(async (context, next) => {
  if (
    context.url.pathname === "/" ||
    /^\/blog(?:\/|$)/.test(context.url.pathname)
  )
    context.locals.cms = await getSiteContent(context.url.pathname === "/");
  return next();
});
