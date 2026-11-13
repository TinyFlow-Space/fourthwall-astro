import { defineField, type FieldDefinition } from "sanity";

/** Each layout has a sibling object: hiding an inactive layout never deletes it. */
export function sectionVariantsField(options: {
  name: string;
  title: string;
  defaultVariant: string;
  variants: { name: string; title: string; fields: FieldDefinition[] }[];
}): FieldDefinition {
  return defineField({
    name: options.name,
    title: options.title,
    type: "object",
    options: { collapsible: false },
    description:
      "Choose a layout, then edit its content below. Switching layouts preserves each version's content. Publish to update the website.",
    initialValue: { variant: options.defaultVariant },
    fields: [
      defineField({
        name: "variant",
        title: "Active layout",
        type: "string",
        initialValue: options.defaultVariant,
        options: {
          layout: "radio",
          list: options.variants.map((v) => ({
            title: v.title,
            value: v.name,
          })),
        },
        validation: (rule) =>
          rule.custom(
            (value) =>
              !value ||
              options.variants.some((v) => v.name === value) ||
              "Choose a supported layout.",
          ),
      }),
      ...options.variants.map((variant) =>
        defineField({
          name: variant.name,
          title: variant.title,
          type: "object",
          options: { collapsible: false },
          hidden: ({ parent }) =>
            (parent?.variant || options.defaultVariant) !== variant.name,
          fields: variant.fields,
        }),
      ),
    ],
  });
}
