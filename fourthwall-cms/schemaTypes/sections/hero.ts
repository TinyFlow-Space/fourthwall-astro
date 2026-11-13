import {
  defineArrayMember,
  defineField,
  type ArrayDefinition,
  type FieldDefinition,
  type ObjectDefinition,
} from "sanity";
import { sectionVariantsField } from "./variants";

const button = (name: string, title: string): FieldDefinition =>
  defineField({
    name,
    title,
    type: "object",
    fields: [
      defineField({
        name: "enabled",
        title: "Show button",
        type: "boolean",
        initialValue: true,
      }),
      defineField({ name: "label", title: "Button label", type: "string" }),
      defineField({
        name: "url",
        title: "Button link",
        type: "url",
        validation: (r) =>
          r.uri({ allowRelative: true, scheme: ["https", "http", "mailto"] }),
      }),
    ],
    validation: (rule) =>
      rule.custom(
        (value) =>
          !value ||
          value.enabled === false ||
          (!!value.label && !!value.url) ||
          "Set both the button label and link, or hide the button.",
      ),
  });
const commonFields = (): FieldDefinition[] => [
  defineField({
    name: "heading",
    type: "string",
    title: "Heading",
    description: "Leave unset to use the original Hero heading.",
  }),
  defineField({
    name: "accent",
    type: "string",
    title: "Muted heading text",
    description: "Leave unset to use the original second line.",
  }),
  defineField({
    name: "description",
    type: "text",
    rows: 3,
    title: "Description (optional)",
  }),
  defineField({
    name: "note",
    type: "string",
    title: "Text beside the button",
    description: "Defaults to the original no-upfront-costs message.",
  }),
  button("button", "Primary button (defaults to the global CTA)"),
  button("secondaryButton", "Secondary button (optional)"),
  defineField({
    name: "background",
    title: "Background (optional)",
    type: "object",
    fields: [
      defineField({
        name: "color",
        title: "Background color",
        type: "string",
        description:
          "Hex color, e.g. #101010. Choose a dark color for the existing white text. Unset keeps the current background.",
        validation: (r) =>
          r.regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
            name: "hex color",
          }),
      }),
      defineField({
        name: "image",
        title: "Background image",
        type: "image",
        options: { hotspot: true },
      }),
    ],
  }),
];

export function heroVariantsField(slides: FieldDefinition): FieldDefinition {
  const slideArray = slides as ArrayDefinition;
  const variantSlides = defineField({
    name: "slides",
    type: "array",
    validation: (r) => r.min(1),
    of: slideArray.of.map((member) => {
      if (member.type !== "object") return member;
      const object = member as ObjectDefinition;
      return defineArrayMember({
        name: object.name || "heroSlide",
        type: "object",
        preview: object.preview,
        fields: object.fields.map((field) =>
          field.name === "type"
            ? defineField({
                name: "type",
                title: "Media type",
                type: "string",
                initialValue: "img",
                options: {
                  list: [
                    { title: "Image", value: "img" },
                    { title: "Video", value: "video" },
                  ],
                },
                validation: (r) =>
                  r
                    .required()
                    .custom(
                      (v) =>
                        !v ||
                        ["img", "video"].includes(v) ||
                        "Choose Image or Video.",
                    ),
              })
            : field,
        ),
      });
    }),
  });
  return sectionVariantsField({
    name: "heroVariants",
    title: "Hero layout & content",
    defaultVariant: "slider",
    variants: [
      {
        name: "slider",
        title: "Variant A — Hero with slider",
        fields: [
          ...commonFields(),
          {
            ...variantSlides,
            name: "slides",
            title: "Slides",
            description:
              "Leave unset to use the existing Hero slides under Images and lists. This list belongs only to Variant A.",
          },
          defineField({
            name: "previousLabel",
            title: "Previous slide label",
            type: "string",
          }),
          defineField({
            name: "nextLabel",
            title: "Next slide label",
            type: "string",
          }),
        ],
      },
      {
        name: "static",
        title: "Variant B — Hero without slider",
        fields: [
          ...commonFields(),
          defineField({
            name: "image",
            title: "Hero image (optional)",
            type: "image",
            options: { hotspot: true },
            fields: [
              defineField({
                name: "alt",
                title: "Alternative text",
                type: "string",
                validation: (r) => r.required(),
              }),
            ],
          }),
          defineField({
            name: "imageHref",
            title: "Image link (optional)",
            type: "url",
            validation: (r) =>
              r.uri({ allowRelative: true, scheme: ["https", "http"] }),
          }),
        ],
      },
    ],
  });
}
