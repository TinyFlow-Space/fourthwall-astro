import { defineField, defineType, type FieldDefinition } from "sanity";
import specs from "./content-fields.json";
interface Spec {
  name?: string;
  title?: string;
  type: string;
  fields?: Spec[];
  of?: Spec[];
}
function field(spec: Spec): FieldDefinition {
  const { fields, of, ...rest } = spec;
  const definition: Record<string, unknown> = { ...rest };
  const names: Record<string, string> = {
    sections: "Section text and links",
    collections: "Images and lists",
    MGF_IMAGES: "Manufacturing backgrounds",
    MGF_PRODUCTS: "Manufacturing product examples",
    HERO_SLIDERS: "Hero slides",
    BRAND_MARQUEE_DATA: "Shop preview slides",
    CREATORS_LEFT: "Creator types — first row",
    CREATORS_RIGHT: "Creator types — second row",
    OPERATIONS_AI_DATA: "AI assistant slides",
    ORBIT_RINGS: "Closing CTA product images",
    DESIGN_MOCKUPS: "Product design previews",
    BRANDS: "Trusted brands",
    FAQS: "Questions and answers",
    NAV_ITEMS: "Main navigation",
    FEATURE_GROUPS: "Features menu groups",
    LEARN_CARDS: "Learn menu cards",
    ELI_CARD: "Featured menu card",
    APP_LINKS: "App download links",
    EXPAND_LINKS: "Additional feature links",
    FOOTER_LINKS: "Footer link groups",
    FOOTER_BOTTOM_LINKS: "Legal links",
    plainText: "Text",
    listItems: "List item content",
    src6A9073Ce9Cab5F62A7A49EdaIntTiktokSvg: "Integration icon",
    src6A90738D84Dd5E7E02Ae237EStatsFlagUsSvg: "First country flag",
    src6A90738C36D8B0Bfe90F3Cd5StatsFlagGbSvg: "Second country flag",
    hrefHttpsMyShopFourthwallComAdminDashboard: "Log in URL",
    hrefHttpsDiscordComInviteT5Vm6Q2425: "Community URL",
  };
  if (spec.name && names[spec.name]) definition.title = names[spec.name];
  if (spec.name === "enabled") definition.initialValue = true;
  if (spec.name === "canonicalUrl") {
    definition.type = "url";
    definition.validation = (r: import("sanity").UrlRule) =>
      r.uri({ scheme: ["https", "http"] });
  }

  if (fields) definition.fields = fields.map(field);
  if (of)
    definition.of = of.map((item) =>
      item.type === "object"
        ? {
            ...item,
            fields: item.fields?.map(field),
            preview: {
              select: {
                title: "title",
                name: "name",
                label: "label",
                question: "question",
                text: "plainText",
              },
              prepare: (v: Record<string, string>) => ({
                title:
                  v.title ||
                  v.name ||
                  v.label ||
                  v.question ||
                  v.text ||
                  "Content item",
              }),
            },
          }
        : item,
    );
  if (spec.type === "text") definition.rows = 3;
  if (
    spec.type === "array" &&
    [
      "HERO_SLIDERS",
      "BRAND_MARQUEE_DATA",
      "MGF_IMAGES",
      "MGF_PRODUCTS",
      "WALL_SHOPS",
      "DESIGN_MOCKUPS",
      "ORBIT_RINGS",
    ].includes(spec.name || "")
  )
    definition.validation = (r: import("sanity").ArrayRule<unknown[]>) =>
      r.min(1);
  if (spec.type === "string" && /^(href|url|action)/i.test(spec.name || ""))
    definition.validation = (r: import("sanity").StringRule) =>
      r.custom(
        (v) =>
          !v ||
          /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/.test(v) ||
          "Use an HTTPS URL, email/phone link, or site-relative path.",
      );
  if (spec.name === "menuKind")
    definition.options = {
      list: [
        { title: "No dropdown", value: "" },
        { title: "Features menu", value: "Features" },
        { title: "Learn menu", value: "Learn" },
      ],
    };
  if (spec.name === "postsPerPage")
    definition.validation = (r: import("sanity").NumberRule) =>
      r.integer().min(1).max(48);
  return defineField(definition as unknown as FieldDefinition);
}
export const managedMedia = defineType({
  name: "managedMedia",
  title: "Image / media",
  type: "object",
  fields: [
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alternative text" }],
    }),
    defineField({
      name: "file",
      type: "file",
      title: "Video file",
      options: { accept: "video/*" },
    }),
    defineField({
      name: "url",
      type: "string",
      title: "Existing URL (fallback)",
      description:
        "Uploaded image/video takes priority. Existing URLs preserve the current site assets.",
      validation: (r) =>
        r.custom(
          (v) =>
            !v ||
            /^(https:\/\/|\/(?!\/))/.test(v) ||
            "Use an HTTPS or site-relative URL.",
        ),
    }),
  ],
  preview: {
    select: { media: "image", title: "url" },
    prepare: ({ media, title }) => ({
      media,
      title: title || "Uploaded media",
    }),
  },
});
export const singletonTypes = Object.keys(specs);
export const contentTypes = Object.entries(specs).map(([name, fields]) =>
  defineType({
    name,
    title: {
      siteSettings: "Site Settings",
      navigation: "Navigation",
      footer: "Footer",
      homePage: "Home Page",
      blogPage: "Blog Page",
    }[name as keyof typeof specs],
    type: "document",
    fields: (fields as Spec[]).map(field),
  }),
);
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      validation: (r) => r.max(150),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (r) => r.max(320),
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "canonicalUrl",
      type: "url",
      validation: (r) => r.uri({ scheme: ["https", "http"] }),
    }),
    defineField({ name: "noIndex", type: "boolean", initialValue: false }),
  ],
});
