import type { APIRoute } from "astro";
import { stopPreview } from "@/lib/sanity/preview";

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect, url }) => {
  stopPreview(cookies, url);
  return redirect("/", 307);
};
