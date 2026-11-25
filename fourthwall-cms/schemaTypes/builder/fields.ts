import { defineArrayMember, defineField, type ConditionalProperty } from "sanity";
import { RangeSliderInput, ResponsiveNumberInput, type SliderOptions } from "./inputs";

/** A number field edited with a drag slider. */
export function sliderField(
  opts: {
    name: string;
    title: string;
    description?: string;
    initialValue?: number;
    hidden?: ConditionalProperty;
    group?: string;
  } & SliderOptions,
) {
  const { name, title, description, initialValue, hidden, group, ...slider } = opts;
  return defineField({
    name,
    title,
    type: "number",
    description,
    initialValue,
    hidden,
    group,
    options: { step: 1, suffix: "", ...slider } as Record<string, unknown>,
    components: { input: RangeSliderInput },
  });
}

/** `{ mobile, tablet, desktop }`, edited with one slider per breakpoint. */
export function responsiveNumberField(opts: {
  name: string;
  title: string;
  description?: string;
  min: number;
  max: number;
  initialValue: { mobile: number; tablet: number; desktop: number };
}) {
  return defineField({
    name: opts.name,
    title: opts.title,
    type: "object",
    description: opts.description,
    options: { min: opts.min, max: opts.max, step: 1 } as Record<string, unknown>,
    components: { input: ResponsiveNumberInput },
    fields: ["mobile", "tablet", "desktop"].map((name) =>
      defineField({ name, type: "number" }),
    ),
    initialValue: opts.initialValue,
  });
}

/** The spacing scale shared by margins and gaps (mapped to --pb-space-* on the site). */
export const SPACING = [
  { title: "None", value: "none" },
  { title: "XS", value: "xs" },
  { title: "SM", value: "sm" },
  { title: "MD", value: "md" },
  { title: "LG", value: "lg" },
  { title: "XL", value: "xl" },
  { title: "2XL", value: "2xl" },
];
export function spacingField(name: string, title: string, initialValue = "none") {
  return defineField({
    name,
    title,
    type: "string",
    initialValue,
    options: { list: SPACING, layout: "radio", direction: "horizontal" },
  });
}

export function choiceField(
  name: string,
  title: string,
  list: [value: string, title: string][],
  initialValue: string,
  layout: "radio" | "dropdown" = "radio",
  extra: { description?: string; hidden?: ConditionalProperty } = {},
) {
  return defineField({
    name,
    title,
    type: "string",
    initialValue,
    ...extra,
    options: {
      list: list.map(([value, t]) => ({ value, title: t })),
      layout,
      direction: "horizontal",
    },
  });
}

/** "Auto" follows the enclosing section's (or card's) alignment. */
export const alignField = (initialValue = "auto") =>
  choiceField("align", "Alignment", [["auto", "Auto"], ["left", "Left"], ["center", "Center"], ["right", "Right"]], initialValue);

export const colorField = (initialValue: string) =>
  choiceField(
    "color",
    "Color",
    [["default", "Default"], ["muted", "Muted"], ["brand", "Brand"]],
    initialValue,
    "radio",
    { description: "Colors follow the section (or card) theme." },
  );

const linkFields = [
  defineField({
    name: "href",
    title: "Link",
    type: "string",
    description: "A URL (https://…), a path (/pricing), or an anchor (#faq).",
    validation: (rule) =>
      rule.custom((value) =>
        !value || /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/.test(value)
          ? true
          : "Use an HTTPS URL, email/phone link, path or anchor.",
      ),
  }),
  defineField({ name: "newTab", title: "Open in new tab", type: "boolean", initialValue: false }),
];
export { linkFields };

/** Turns a plain string into a one-paragraph Portable Text value. */
export function textBlocks(text: string) {
  const key = Math.random().toString(36).slice(2, 10);
  return [
    {
      _type: "block",
      _key: key,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
    },
  ];
}

/** Inline rich text: bold, italic and links; size/color come from the block. */
export function richTextField(initialText: string) {
  return defineField({
    name: "text",
    title: "Text",
    type: "array",
    initialValue: () => textBlocks(initialText),
    validation: (rule) => rule.required(),
    of: [
      defineArrayMember({
        type: "block",
        styles: [{ title: "Normal", value: "normal" }],
        lists: [],
        marks: {
          decorators: [
            { title: "Bold", value: "strong" },
            { title: "Italic", value: "em" },
          ],
          annotations: [
            defineArrayMember({ name: "link", type: "object", title: "Link", fields: linkFields }),
          ],
        },
      }),
    ],
  });
}

/** Plain text of a Portable Text value, for Studio previews. */
export function plainText(value: unknown): string {
  if (!Array.isArray(value)) return typeof value === "string" ? value : "";
  return value
    .map((block: { children?: { text?: unknown }[] }) =>
      (block.children ?? []).map((child) => (typeof child.text === "string" ? child.text : "")).join(""),
    )
    .join(" ")
    .trim();
}
