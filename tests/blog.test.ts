import {
  categoryOptions,
  normalizeCategory,
} from "../src/lib/sanity/categories.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { parse, evaluate } from "groq-js";
import {
  parseBlogParams,
  pageSize,
  blogHref,
} from "../src/lib/sanity/params.ts";
import {
  listingQuery,
  postQuery,
  relatedQuery,
} from "../src/lib/sanity/queries.ts";
const ref = (_ref: string) => ({ _type: "reference", _ref });
const dataset = [
  {
    _id: "c1",
    _type: "category",
    title: "Design",
    slug: { current: "design" },
  },
  { _id: "t1", _type: "tag", title: "Merch", slug: { current: "merch" } },
  {
    _id: "c2",
    _type: "category",
    title: "Unused",
    slug: { current: "unused" },
  },
  { _id: "a1", _type: "author", name: "Test Author" },
  ...Array.from({ length: 8 }, (_, index) => ({
    _id: `p${index}`,
    _type: "post",
    title: `Design ${index}`,
    slug: { current: `design-${index}` },
    publishedAt: "2020-01-01T00:00:00Z",
    featured: index === 0,
    author: ref("a1"),
    categories: [ref("c1")],
    tags: index % 2 ? [ref("t1")] : [],
    body: [
      { _type: "block", children: [{ _type: "span", text: "Creative ideas" }] },
    ],
  })),
  {
    _id: "drafts.hidden",
    _type: "post",
    title: "Hidden",
    slug: { current: "hidden" },
    publishedAt: "2020-01-01T00:00:00Z",
  },
  {
    _id: "future",
    _type: "post",
    title: "Future",
    slug: { current: "future" },
    publishedAt: "2099-01-01T00:00:00Z",
  },
];
async function query(source: string, params: Record<string, unknown>) {
  return (await evaluate(parse(source, { params }), { dataset, params })).get();
}
const params = {
  q: "",
  search: [],
  category: "",
  tagSlug: "",
  start: 0,
  end: 3,
};
test("normalizes URL state and bounds page size", () => {
  assert.deepEqual(
    parseBlogParams(new URLSearchParams("page=-2&q=%20hello%20")),
    { page: 1, q: "hello", category: "", tag: "" },
  );
  assert.equal(parseBlogParams(new URLSearchParams("page=Infinity")).page, 1);
  assert.equal(pageSize("0"), 6);
  assert.equal(pageSize("100"), 48);
  assert.equal(
    blogHref({ page: 2, q: "a & b", category: "design", tag: "" }),
    "/blog?q=a+%26+b&category=design&page=2",
  );
});
test("queries exclude drafts/future posts, paginate deterministically, and use only populated taxonomy", async () => {
  const data = await query(listingQuery, params);
  assert.equal(data.total, 8);
  assert.equal(data.posts.length, 3);
  assert.deepEqual(
    data.posts.map((p: { _id: string }) => p._id),
    ["p0", "p1", "p2"],
  );
  assert.deepEqual(
    data.categories.map((c: { _id: string }) => c._id),
    ["c1"],
  );
  assert.equal(data.featured._id, "p0");
  const page = await query(listingQuery, { ...params, start: 3, end: 6 });
  assert.equal(page.posts[0]._id, "p3");
});
test("search and filters combine before pagination", async () => {
  const data = await query(listingQuery, {
    ...params,
    q: "Design",
    search: ["Design*"],
    category: "design",
    tagSlug: "merch",
  });
  assert.equal(data.total, 4);
  assert.equal(data.posts.length, 3);
  assert.equal(
    (await query(listingQuery, { ...params, category: "missing" })).total,
    0,
  );
  assert.equal(
    (
      await query(listingQuery, {
        ...params,
        q: "Creative",
        search: ["Creative*"],
      })
    ).total,
    8,
  );
});
test("detail handles missing/unpublished slugs and recommendations exclude current post", async () => {
  assert.equal(await query(postQuery, { slug: "hidden" }), null);
  assert.equal(await query(postQuery, { slug: "future" }), null);
  assert.equal(await query(postQuery, { slug: "missing" }), null);
  assert.equal(
    (await query(postQuery, { slug: "design-0" })).title,
    "Design 0",
  );
  const related = await query(relatedQuery, {
    id: "p0",
    categories: ["c1"],
    tags: ["t1"],
  });
  assert.equal(related.length, 3);
  assert.ok(related.every((p: { _id: string }) => p._id !== "p0"));
  assert.equal(related[0].relevance, 2);
});

test("Featured tab includes featured posts without a category reference", async () => {
  const data = await query(listingQuery, { ...params, category: "featured" });
  assert.equal(data.total, 1);
  assert.equal(data.posts[0]._id, "p0");
  const filtered = await query(listingQuery, {
    ...params,
    category: "featured",
    q: "absent",
    search: ["absent*"],
  });
  assert.equal(filtered.total, 0);
});

test("category tabs preserve labels, use CMS slugs and default safely for unknown values", () => {
  const categories = [
    { _id: "one", title: "Trends & Insights", slug: "trends-and-insights" },
    { _id: "two", title: "Design", slug: "design" },
  ];
  assert.equal(categoryOptions(categories)[0].label, "Latest");
  assert.equal(categoryOptions(categories)[5].value, "trends-and-insights");
  assert.equal(normalizeCategory("design", categories), "design");
  assert.equal(normalizeCategory("featured", categories), "featured");
  assert.equal(normalizeCategory("unknown", categories), "");
  assert.equal(normalizeCategory("latest", categories), "");
});

test("all post projections preserve valid taxonomy and omit unresolved or incomplete references", async () => {
  const fixture = [
    {
      _id: "category",
      _type: "category",
      title: "Design",
      slug: { current: "design" },
    },
    { _id: "tag", _type: "tag", title: "Merch", slug: { current: "merch" } },
    { _id: "no-slug", _type: "category", title: "Incomplete" },
    { _id: "no-title", _type: "tag", slug: { current: "incomplete" } },
    ...["post-a", "post-b"].map((_id) => ({
      _id,
      _type: "post",
      title: _id,
      slug: { current: _id },
      publishedAt: "2020-01-01T00:00:00Z",
      featured: true,
      categories: [ref("category"), ref("deleted"), null, ref("no-slug")],
      tags: [ref("tag"), ref("unpublished"), null, ref("no-title")],
    })),
    {
      _id: "no-taxonomy",
      _type: "post",
      title: "No taxonomy",
      slug: { current: "no-taxonomy" },
      publishedAt: "2020-01-01T00:00:00Z",
    },
  ];
  const run = async (source: string, values: Record<string, unknown>) =>
    (
      await evaluate(parse(source, { params: values }), {
        dataset: fixture,
        params: values,
      })
    ).get();
  const listing = await run(listingQuery, { ...params, end: 10 });
  const detail = await run(postQuery, { slug: "post-a" });
  const related = await run(relatedQuery, {
    id: "no-taxonomy",
    categories: ["category"],
    tags: ["tag"],
  });
  for (const post of [
    listing.featured,
    ...listing.posts.filter(
      (post: { _id: string }) => post._id !== "no-taxonomy",
    ),
    detail,
    ...related,
  ]) {
    assert.deepEqual(post.categories, [
      { _id: "category", title: "Design", slug: "design" },
    ]);
    assert.deepEqual(post.tags, [
      { _id: "tag", title: "Merch", slug: "merch" },
    ]);
  }
  const uncategorized = await run(postQuery, { slug: "no-taxonomy" });
  assert.deepEqual(uncategorized.categories, []);
  assert.deepEqual(uncategorized.tags, []);
});
