import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";
const home = { title: "Home", href: "/" };
const blog = { title: "Blog", href: "/blog" };
const globalLocations = defineLocations({ locations: [home, blog], message: "Shared across the site", tone: "caution" });
export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: [
    { route: "/", filter: '_type == "homePage"' },
    { route: "/blog", filter: '_type == "blogPage"' },
    { route: "/blog/:slug", filter: '_type == "post" && slug.current == $slug' },
  ],
  locations: {
    homePage: defineLocations({ locations: [home] }),
    blogPage: defineLocations({ locations: [blog] }),
    siteSettings: globalLocations, navigation: globalLocations, footer: globalLocations,
    product: defineLocations({ locations: [home] }),
    productCategory: defineLocations({ locations: [home] }),
    post: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: doc => ({ locations: doc?.slug ? [{ title: doc.title || "Post", href: `/blog/${encodeURIComponent(doc.slug)}` }, blog] : [blog] }),
    }),
    author: defineLocations({ locations: [blog] }),
    category: defineLocations({ locations: [blog] }),
    tag: defineLocations({ locations: [blog] }),
  },
};
