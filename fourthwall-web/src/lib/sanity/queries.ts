import { defineQuery } from "groq";
// Only published posts whose publication date has arrived are displayed.
const published = `_type == "post" && defined(slug.current) && defined(publishedAt) && dateTime(publishedAt) <= dateTime(now()) && !(_id in path("drafts.**"))`;
// Effective date: `updatedAt` when it is later than `publishedAt` (and not in the
// future), otherwise `publishedAt`. Used for display and every date sort.
export const effectiveDate = `select(
  defined(updatedAt) && dateTime(updatedAt) > dateTime(publishedAt) && dateTime(updatedAt) <= dateTime(now()) => updatedAt,
  publishedAt
)`;
export type SortDirection = "asc" | "desc";
const byDate = (direction: SortDirection = "desc") =>
  `order(${effectiveDate} ${direction}, _id asc)`;
// Group dereferenced arrays before filtering; otherwise GROQ filters each object
// and produces null entries instead of filtering the array.
const summary = `_id, title, "slug": slug.current, "excerpt": coalesce(excerpt, ""), publishedAt, updatedAt,
  "effectiveDate": ${effectiveDate},
  "featured": coalesce(featured, false), mainImage,
  author->{name, bio, role, image, website},
  "categories": coalesce((categories[]->{_id,title,"slug":slug.current})[defined(slug) && defined(title)], []),
  "tags": coalesce((tags[]->{_id,title,"slug":slug.current})[defined(slug) && defined(title)], [])`;
// The post shown in the Featured block above the listing.
const featuredPost = `*[${published} && featured == true] | ${byDate()}[0]`;
// Keep the featured post out of the grid so it shows only once; the Featured
// tab still lists it, since it is the tab's subject.
const filtered = `${published}
  && ($category == "featured" || _id != ${featuredPost}._id)
  && ($category == "" || $category in categories[]->slug.current || ($category == "featured" && featured == true))
  && ($tagSlug == "" || $tagSlug in tags[]->slug.current)
  && ($q == "" || title match $search || excerpt match $search || author->name match $search || pt::text(body) match $search)`;
// GROQ cannot parameterize sort direction, so build one query per direction.
const listing = (direction: SortDirection) => `{
  "total": count(*[${filtered}]),
  "posts": *[${filtered}] | ${byDate(direction)} [$start...$end] {${summary}},
  "featured": ${featuredPost} {${summary}},
  "categories": *[_type == "category" && defined(slug.current) && count(*[${published} && references(^._id)]) > 0] | order(title asc) {_id,title,"slug":slug.current},
  "tags": *[_type == "tag" && defined(slug.current) && count(*[${published} && references(^._id)]) > 0] | order(title asc) {_id,title,"slug":slug.current}
}`;
export const listingQueries: Record<SortDirection, string> = {
  desc: defineQuery(listing("desc")),
  asc: defineQuery(listing("asc")),
};
export const postQuery =
  defineQuery(`*[${published} && slug.current == $slug][0] {
  ${summary}, _updatedAt, seo, video{id, title, description, uploadDate, duration, thumbnail}, enableAudio, audioUrl, audioDuration, "relatedPosts": (relatedPosts[]->)[${published} && _id != ^._id]{${summary}}, body[]{..., file{..., "url": asset->url}, captions{..., "url": asset->url}}, summary, "faqs": coalesce(faqs, [])
}`);
// Require a shared category before sorting; never fill gaps with unrelated posts.
export const relatedQuery = defineQuery(`*[${published} && _id != $id
  && count(categories[@._ref in $categories]) > 0
] | ${byDate()}[0...3] {${summary}}`);
