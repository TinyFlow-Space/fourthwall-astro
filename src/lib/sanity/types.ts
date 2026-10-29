import type { PortableTextBlock } from "@portabletext/types";
export interface SanityImage {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
  alt?: string;
  caption?: string;
  crop?: { top: number; bottom: number; left: number; right: number };
  hotspot?: { x: number; y: number; width: number; height: number };
}
export interface Taxonomy {
  _id: string;
  title: string;
  slug: string;
}
export interface Author {
  name: string;
  bio?: string;
  role?: string;
  image?: SanityImage;
  website?: string;
}
export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  featured: boolean;
  mainImage?: SanityImage;
  author?: Author;
  categories: Taxonomy[];
  tags: Taxonomy[];
}
export type BodyBlock = PortableTextBlock | (SanityImage & { _key: string });
export interface Post extends PostSummary {
  _updatedAt: string;
  body: BodyBlock[];
  summary?: string;
  faqs: { _key: string; question: string; answer: string }[];
}
export interface Listing {
  posts: PostSummary[];
  total: number;
  categories: Taxonomy[];
  tags: Taxonomy[];
  featured: PostSummary | null;
}
