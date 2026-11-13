import { heroVariantsProjection } from "./sections.ts";
import { defineQuery } from "groq";
export const siteContentQuery = defineQuery(`{
 "siteSettings": *[_id == "siteSettings"][0],
 "navigation": *[_id == "navigation"][0],
 "footer": *[_id == "footer"][0],
 "blogPage": *[_id == "blogPage"][0],
 "homePage": select($home => *[_id == "homePage"][0]{..., ${heroVariantsProjection}}),
 "products": select($home => *[_type == "product" && enabled == true && !(_id in path("drafts.**"))] | order(order asc, _id asc) {...,"category":category->slug.current}),
 "productCategories": select($home => *[_type == "productCategory" && !(_id in path("drafts.**"))] | order(order asc,title asc) {title,"slug":slug.current})
}`);
