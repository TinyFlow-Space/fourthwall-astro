import {
  cleanTechnicalContent,
  encodeDraftEditLinks,
  isTechnicalField,
  visualEditingEnabled,
} from "./stega";
import { createClient } from "@sanity/client";
import type { QueryParams } from "@sanity/client";
import type { Listing, Post, PostSummary } from "./types";
import { listingQueries, postQuery, relatedQuery } from "./queries";
import { pageSize, type BlogParams } from "./params";

import { normalizeCategory } from "./categories";
import { sanityDataset, sanityProjectId, sanityStudioUrl } from "./config";
import { readToken } from "./preview";

export const postsPerPage = pageSize(import.meta.env.BLOG_POSTS_PER_PAGE);
/**
 * `preview` is set for verified Presentation sessions (see ./preview.ts):
 * drafts are read with the token, and stega powers click-to-edit overlays.
 */
export function sanityClient(preview = false) {
  const token = readToken();
  const drafts = preview && !!token;
  const editable = drafts || visualEditingEnabled;
  return createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: "2026-03-01",
    token: token || undefined,
    useCdn: !editable && !token,
    perspective: drafts ? "drafts" : "published",
    stega: {
      enabled: editable,
      studioUrl: sanityStudioUrl,
      filter: (props) =>
        !props.sourcePath.some(
          (part) => typeof part === "string" && isTechnicalField(part),
        ) && props.filterDefault(props),
    },
    timeout: 10000,
    maxRetries: 1,
  });
}
export async function query<T>(
  groq: string,
  params: QueryParams,
  preview = false,
): Promise<T> {
  const client = sanityClient(preview);
  if (!client.config().stega.enabled)
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
  preview = false,
): Promise<{ data: Listing; params: BlogParams }> {
  const perPage = pageSize(String(requestedPageSize));
  const fetchPage = (page: number) =>
    query<Listing>(listingQueries[params.sort], {
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
    }, preview);
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
export const getPost = (slug: string, preview = false) =>
  query<Post | null>(postQuery, { slug }, preview);
export const getRelated = (
  post: Post,
  preview = false,
): Promise<PostSummary[]> => {
  if (post.relatedPosts?.length) return Promise.resolve(post.relatedPosts);
  const categories = post.categories.map((category) => category._id);
  if (!categories.length) return Promise.resolve([]);
  return query<PostSummary[]>(
    relatedQuery,
    { id: post._id, categories },
    preview,
  );
};
