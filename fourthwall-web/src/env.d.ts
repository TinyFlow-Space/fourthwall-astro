/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    cms?: import("./lib/sanity/content").SiteContent;
  }
}
