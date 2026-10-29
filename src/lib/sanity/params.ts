export interface BlogParams {
  q: string;
  category: string;
  tag: string;
  page: number;
}
export function parseBlogParams(params: URLSearchParams): BlogParams {
  const page = Number(params.get("page"));
  return {
    q: (params.get("q") ?? "").trim().slice(0, 120),
    category: (params.get("category") ?? "").slice(0, 96),
    tag: (params.get("tag") ?? "").slice(0, 96),
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1,
  };
}
export function pageSize(value?: string): number {
  const size = Number(value);
  return Number.isInteger(size) && size > 0 ? Math.min(size, 48) : 6;
}
export function blogHref(params: BlogParams, page = params.page): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.tag) query.set("tag", params.tag);
  if (page > 1) query.set("page", String(page));
  return `/blog${query.size ? `?${query}` : ""}`;
}
