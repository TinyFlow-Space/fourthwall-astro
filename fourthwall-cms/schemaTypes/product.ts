import { defineType, defineField } from "sanity";
const slug = defineField({
  name: "slug",
  type: "slug",
  options: { source: "title", maxLength: 96 },
  validation: (r) => r.required(),
});
const title = defineField({
  name: "title",
  type: "string",
  validation: (r) => r.required(),
});
export const productCategory = defineType({
  name: "productCategory",
  title: "Product Category",
  type: "document",
  fields: [
    title,
    slug,
    defineField({ name: "description", type: "text" }),
    defineField({ name: "order", type: "number", initialValue: 0 }),
  ],
});
export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    title,
    slug,
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "productCategory" }],
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", type: "text" }),
    defineField({
      name: "src",
      title: "Product image",
      type: "managedMedia",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "featuredImage",
      type: "managedMedia",
      title: "Featured grid image",
    }),
    defineField({
      name: "hoverSrc",
      type: "managedMedia",
      title: "Featured hover image",
    }),
    defineField({
      name: "href",
      title: "Product link",
      type: "url",
      validation: (r) =>
        r.required().uri({ scheme: ["https", "http"], allowRelative: true }),
    }),
    defineField({
      name: "featuredHref",
      title: "Featured link (optional)",
      type: "url",
      validation: (r) =>
        r.uri({ scheme: ["https", "http"], allowRelative: true }),
    }),
    defineField({
      name: "price",
      title: "Price label",
      type: "string",
      description: "For example: From $15.45",
    }),
    ...["enabled", "catalog", "featured", "bestseller"].map((name) =>
      defineField({
        name,
        type: "boolean",
        initialValue: name === "enabled" || name === "catalog",
      }),
    ),
    ...["order", "featuredOrder", "reviews", "colorCount"].map((name) =>
      defineField({
        name,
        type: "number",
        initialValue: 0,
        validation: (r) => r.integer().min(0),
      }),
    ),
    defineField({
      name: "rating",
      type: "number",
      validation: (r) => r.min(0).max(5),
    }),
    ...["tech", "badges", "tags"].map((name) =>
      defineField({ name, type: "array", of: [{ type: "string" }] }),
    ),
    defineField({
      name: "colors",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string" },
            {
              name: "hex",
              type: "string",
              validation: (r) => r.regex(/^#[a-fA-F0-9]{6}$/),
            },
          ],
        },
      ],
    }),
  ],
  preview: { select: { title: "title", media: "src.image" } },
});
