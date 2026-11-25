/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    cms?: import("./lib/sanity/content").SiteContent;
    /** Verified Presentation draft preview (see lib/sanity/preview.ts). */
    preview?: boolean;
  }
}
