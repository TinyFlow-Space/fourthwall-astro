import { defineArrayMember, defineField } from "sanity";
import { videoUrl, socialUrl } from "../../src/lib/blog/embeds";
const title = defineField({
  name: "title",
  title: "Accessible title",
  type: "string",
  validation: (r) => r.required(),
});
const height = defineField({
  name: "height",
  title: "Frame height (pixels)",
  type: "number",
  initialValue: 600,
  validation: (r) => r.integer().min(160).max(1600),
  description:
    "Content scrolls inside this frame when taller. Check mobile preview.",
});
export const richContent = [
  defineArrayMember({
    name: "table",
    title: "Table",
    type: "object",
    fields: [
      defineField({
        name: "caption",
        type: "string",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "headerRow",
        title: "First row contains column headings",
        type: "boolean",
        initialValue: true,
      }),
      defineField({
        name: "rows",
        type: "array",
        validation: (r) =>
          r
            .required()
            .min(1)
            .custom(
              (rows) =>
                !rows ||
                rows.every(
                  (row: any) =>
                    row.cells?.length === (rows[0] as any)?.cells?.length,
                ) ||
                "Every row must have the same number of cells.",
            ),
        of: [
          defineArrayMember({
            name: "row",
            type: "object",
            fields: [
              defineField({
                name: "cells",
                type: "array",
                of: [{ type: "string" }],
                validation: (r) => r.required().min(1).max(20),
              }),
            ],
            preview: {
              select: { cells: "cells" },
              prepare: ({ cells }) => ({
                title: cells?.join(" | ") || "Empty row",
              }),
            },
          }),
        ],
      }),
    ],
  }),
  defineArrayMember({
    name: "videoEmbed",
    title: "Video embed / upload",
    type: "object",
    fields: [
      title,
      defineField({
        name: "url",
        title: "YouTube or Vimeo URL",
        type: "url",
        validation: (r) =>
          r.custom((v) =>
            !v || videoUrl(v)
              ? true
              : "Enter a YouTube watch, shorts, share or embed URL, or a Vimeo video URL.",
          ),
      }),
      defineField({
        name: "file",
        title: "Or upload a video",
        type: "file",
        options: { accept: "video/*" },
      }),
      defineField({
        name: "captions",
        title: "WebVTT captions (uploaded video)",
        type: "file",
        options: { accept: ".vtt" },
      }),
      defineField({
        name: "captionLanguage",
        type: "string",
        initialValue: "en",
      }),
    ],
    validation: (r) =>
      r.custom(
        (v: any) =>
          Boolean(v?.url) !== Boolean(v?.file?.asset) ||
          "Provide either a video URL or an uploaded file.",
      ),
  }),
  defineArrayMember({
    name: "socialEmbed",
    title: "Instagram / Spotify embed",
    type: "object",
    fields: [
      title,
      defineField({
        name: "url",
        title: "Post, reel, carousel or Spotify URL",
        type: "url",
        validation: (r) =>
          r
            .required()
            .custom((v) =>
              !v || socialUrl(v)
                ? true
                : "Use a public Instagram post/reel or Spotify track, album, playlist, episode or show URL.",
            ),
      }),
      height,
    ],
  }),
  ...(["htmlEmbed", "scriptEmbed"] as const).map((name) =>
    defineArrayMember({
      name,
      title: name === "htmlEmbed" ? "HTML embed" : "Embed script",
      type: "object",
      fields: [
        title,
        defineField({
          name: "html",
          title: "Embed HTML",
          type: "text",
          rows: 8,
          validation: (r) => r.required().max(100000),
          description:
            "Isolated frame. Inline JavaScript, forms, popups and parent-page access are blocked. Use the separate script URL field for external scripts.",
        }),
        ...(name === "scriptEmbed"
          ? [
              defineField({
                name: "scriptUrl",
                title: "External script URL",
                type: "url",
                validation: (r) => r.required().uri({ scheme: ["https"] }),
                description:
                  "Only use a trusted provider's HTTPS script. Providers requiring cookies or parent-page access may not work in isolation.",
              }),
            ]
          : []),
        height,
        defineField({
          name: "fallbackUrl",
          title: "Link to original content",
          type: "url",
          validation: (r) => r.uri({ scheme: ["https"] }),
        }),
      ],
    }),
  ),
];
