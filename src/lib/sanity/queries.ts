import { defineQuery } from "groq";
// Every query excludes drafts and future publications, including related posts.
const published = `_type == "post" && defined(slug.current) && defined(publishedAt) && dateTime(publishedAt) <= dateTime(now()) && !(_id in path("drafts.**"))`;
// Group dereferenced arrays before filtering; otherwise GROQ filters each object
// and produces null entries instead of filtering the array.
const summary = `_id, title, "slug": slug.current, "excerpt": coalesce(excerpt, ""), publishedAt,
  "featured": coalesce(featured, false), mainImage,
  author->{name, bio, role, image, website},
  "categories": coalesce((categories[]->{_id,title,"slug":slug.current})[defined(slug) && defined(title)], []),
  "tags": coalesce((tags[]->{_id,title,"slug":slug.current})[defined(slug) && defined(title)], [])`;
const filtered = `${published}
  && ($category == "" || $category in categories[]->slug.current || ($category == "featured" && featured == true))
  && ($tagSlug == "" || $tagSlug in tags[]->slug.current)
  && ($q == "" || title match $search || excerpt match $search || author->name match $search || pt::text(body) match $search)`;
export const listingQuery = defineQuery(`{
  "total": count(*[${filtered}]),
  "posts": *[${filtered}] | order(publishedAt desc, _id asc) [$start...$end] {${summary}},
  "featured": *[${published} && featured == true] | order(publishedAt desc, _id asc)[0] {${summary}},
  "categories": *[_type == "category" && defined(slug.current) && count(*[${published} && references(^._id)]) > 0] | order(title asc) {_id,title,"slug":slug.current},
  "tags": *[_type == "tag" && defined(slug.current) && count(*[${published} && references(^._id)]) > 0] | order(title asc) {_id,title,"slug":slug.current}
}`);
export const postQuery =
  defineQuery(`*[${published} && slug.current == $slug][0] {
  ${summary}, _updatedAt, body, summary, "faqs": coalesce(faqs, [])
}`);
// Require a shared category before sorting; never fill gaps with unrelated posts.
export const relatedQuery = defineQuery(`*[${published} && _id != $id
  && count(categories[@._ref in $categories]) > 0
] | order(publishedAt desc, _id asc)[0...3] {${summary}}`);
