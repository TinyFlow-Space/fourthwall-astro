import { defineArrayMember, defineField, defineType } from "sanity";
const slug = defineField({
  name: "slug",
  type: "slug",
  options: { source: "title", maxLength: 96 },
  validation: (rule) =>
    rule
      .required()
      .custom((value) =>
        !value?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)
          ? true
          : "Use lowercase letters, numbers and hyphens.",
      ),
});
const imageFields = [
  defineField({
    name: "alt",
    type: "string",
    title: "Alternative text",
    validation: (rule) => rule.required(),
  }),
  defineField({ name: "caption", type: "string" }),
];
const taxonomy = (name: "category" | "tag") =>
  defineType({
    name,
    title: name === "category" ? "Category" : "Tag",
    type: "document",
    fields: [
      defineField({
        name: "title",
        type: "string",
        validation: (rule) => rule.required(),
      }),
      slug,
    ],
  });
export const schemaTypes = [
  taxonomy("category"),
  taxonomy("tag"),
  defineType({
    name: "author",
    type: "document",
    fields: [
      defineField({
        name: "name",
        type: "string",
        validation: (rule) => rule.required(),
      }),
      defineField({ name: "role", type: "string" }),
      defineField({ name: "bio", type: "text", rows: 4 }),
      defineField({
        name: "website",
        type: "url",
        validation: (rule) => rule.uri({ scheme: ["https", "http"] }),
      }),
      defineField({
        name: "image",
        type: "image",
        options: { hotspot: true },
        fields: imageFields,
      }),
    ],
  }),
  defineType({
    name: "post",
    type: "document",
    fields: [
      defineField({
        name: "title",
        type: "string",
        validation: (rule) => rule.required().max(150),
      }),
      slug,
      defineField({
        name: "excerpt",
        type: "text",
        rows: 3,
        validation: (rule) => rule.required().max(320),
      }),
      defineField({
        name: "mainImage",
        title: "Featured image",
        type: "image",
        options: { hotspot: true },
        fields: imageFields,
        validation: (rule) => rule.required().assetRequired(),
      }),
      defineField({
        name: "author",
        type: "reference",
        to: [{ type: "author" }],
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: "publishedAt",
        type: "datetime",
        initialValue: () => new Date().toISOString(),
        validation: (rule) => rule.required(),
      }),
      defineField({ name: "featured", type: "boolean", initialValue: false }),
      defineField({
        name: "categories",
        type: "array",
        of: [
          defineArrayMember({ type: "reference", to: [{ type: "category" }] }),
        ],
        validation: (rule) => rule.unique(),
      }),
      defineField({
        name: "tags",
        type: "array",
        of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
        validation: (rule) => rule.unique(),
      }),
      defineField({
        name: "summary",
        title: "TL;DR summary",
        type: "text",
        rows: 3,
      }),
      defineField({
        name: "body",
        type: "array",
        validation: (rule) => rule.required().min(1),
        of: [
          defineArrayMember({
            type: "block",
            styles: [
              { title: "Normal", value: "normal" },
              { title: "Heading 2", value: "h2" },
              { title: "Heading 3", value: "h3" },
              { title: "Quote", value: "blockquote" },
            ],
            marks: {
              decorators: [
                { title: "Strong", value: "strong" },
                { title: "Emphasis", value: "em" },
                { title: "Code", value: "code" },
              ],
              annotations: [
                {
                  name: "link",
                  type: "object",
                  fields: [
                    {
                      name: "href",
                      type: "url",
                      validation: (rule) =>
                        rule
                          .required()
                          .uri({
                            allowRelative: true,
                            scheme: ["https", "http", "mailto"],
                          }),
                    },
                  ],
                },
              ],
            },
          }),
          defineArrayMember({
            type: "image",
            options: { hotspot: true },
            fields: imageFields,
          }),
        ],
      }),
      defineField({
        name: "faqs",
        title: "FAQs",
        type: "array",
        of: [
          defineArrayMember({
            name: "faq",
            type: "object",
            fields: [
              defineField({
                name: "question",
                type: "string",
                validation: (rule) => rule.required(),
              }),
              defineField({
                name: "answer",
                type: "text",
                validation: (rule) => rule.required(),
              }),
            ],
          }),
        ],
      }),
    ],
    preview: {
      select: { title: "title", subtitle: "author.name", media: "mainImage" },
    },
    orderings: [
      {
        title: "Publication date",
        name: "publishedAtDesc",
        by: [{ field: "publishedAt", direction: "desc" }],
      },
    ],
  }),
];
