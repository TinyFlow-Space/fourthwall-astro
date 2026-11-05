import {
  cleanTechnicalContent,
  encodeDraftEditLinks,
  isTechnicalField,
  visualEditingEnabled,
} from "./stega";
import { createClient } from "@sanity/client";
import { getSecret } from "astro:env/server";
import type { QueryParams } from "@sanity/client";
import type { Listing, Post, PostSummary } from "./types";
import { listingQuery, postQuery, relatedQuery } from "./queries";
import { pageSize, type BlogParams } from "./params";

import { normalizeCategory } from "./categories";

export const postsPerPage = pageSize(import.meta.env.BLOG_POSTS_PER_PAGE);
export function sanityClient() {
  if (!import.meta.env.PUBLIC_SANITY_PROJECT_ID)
    throw new Error("Sanity is not configured");
  const token = getSecret("SANITY_API_READ_TOKEN");
  return createClient({
    projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
    dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2026-03-01",
    token: token || undefined,
    useCdn: !visualEditingEnabled && !token,
    perspective: "published",
    stega: {
      enabled: visualEditingEnabled,
      studioUrl:
        import.meta.env.PUBLIC_SANITY_STUDIO_URL || "http://localhost:3333",
      filter: (props) =>
        !props.sourcePath.some(
          (part) => typeof part === "string" && isTechnicalField(part),
        ) && props.filterDefault(props),
    },
    timeout: 10000,
    maxRetries: 1,
  });
}
export async function query<T>(groq: string, params: QueryParams): Promise<T> {
  const client = sanityClient();
  if (!visualEditingEnabled)
    return cleanTechnicalContent(await client.fetch<T>(groq, params));
  const { result, resultSourceMap } = await client.fetch<T>(groq, params, {
    filterResponse: false,
    resultSourceMap: "withKeyArraySelector",
    stega: false,
  });
  return cleanTechnicalContent(
    encodeDraftEditLinks(result, resultSourceMap, {
      ...client.config().stega,
      enabled: true,
    }),
  );
}
export async function getListing(
  params: BlogParams,
  requestedPageSize = postsPerPage,
): Promise<{ data: Listing; params: BlogParams }> {
  const perPage = pageSize(String(requestedPageSize));
  const fetchPage = (page: number) =>
    query<Listing>(listingQuery, {
      q: params.q,
      category: params.category,
      tagSlug: params.tag,
      // Strip GROQ match operators; query input is always bound, never interpolated.
      search: params.q
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => `${word}*`),
      start: (page - 1) * perPage,
      end: page * perPage,
    });
  let data = await fetchPage(params.page);
  const category = normalizeCategory(params.category, data.categories);
  if (category !== params.category) {
    params = { ...params, category, page: 1 };
    data = await fetchPage(1);
  }
  const page = Math.min(
    params.page,
    Math.max(1, Math.ceil(data.total / perPage)),
  );
  if (page !== params.page) data = await fetchPage(page);
  return { data, params: { ...params, page } };
}
export const getPost = (slug: string) =>
  query<Post | null>(postQuery, { slug });
export const getRelated = (post: Post): Promise<PostSummary[]> => {
  if (post.relatedPosts?.length) return Promise.resolve(post.relatedPosts);
  const categories = post.categories.map((category) => category._id);
  if (!categories.length) return Promise.resolve([]);
  return query<PostSummary[]>(relatedQuery, { id: post._id, categories });
};
