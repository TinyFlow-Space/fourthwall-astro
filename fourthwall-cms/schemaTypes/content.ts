import { defineField, defineType, type FieldDefinition } from "sanity";
import specs from "./content-fields.json";
interface Spec {
  name?: string;
  title?: string;
  type: string;
  fields?: Spec[];
  of?: Spec[];
}
// Human-readable labels for the Studio form and the Presentation (Visual Editor) tool.
const documentTitles: Record<string, string> = {
  siteSettings: "Site Settings",
  navigation: "Navigation",
  footer: "Footer",
  homePage: "Homepage",
  blogPage: "Blog Page",
};
const pageLabels: Record<string, string> = {
  siteSettings: "Site Settings",
  navigation: "Navigation",
  footer: "Footer",
  homePage: "Homepage",
  blogPage: "Blog",
};
// Keyed by `<document>.<field>` for direct children of `sections`/`collections`
// and selected top-level fields; shown as "<Page> – <Label>".
const sectionLabels: Record<string, string> = {
  "homePage.hero": "Hero Section",
  "homePage.aiIntegrationBox": "AI Integrations",
  "homePage.brandManufactureSlider": "Manufacturing Slider",
  "homePage.shippingGlobe": "Shipping Globe",
  "homePage.madeWith": "Made With Fourthwall",
  "homePage.creators": "Creators",
  "homePage.faq": "FAQ",
  "homePage.productDesign": "Product Design",
  "homePage.trustedBrands": "Trusted Brands",
  "homePage.featuredProducts": "Featured Products",
  "homePage.testimonials": "Testimonials",
  "homePage.operations": "Operations",
  "homePage.products": "Products",
  "homePage.brandShowcase": "Brand Showcase",
  "homePage.BRANDS": "Trusted Brands Logos",
  "homePage.CREATORS_LEFT": "Creator Types (First Row)",
  "homePage.CREATORS_RIGHT": "Creator Types (Second Row)",
  "homePage.DESIGN_MOCKUPS": "Product Design Previews",
  "homePage.FAQS": "FAQ Questions",
  "homePage.MGF_IMAGES": "Manufacturing Backgrounds",
  "homePage.MGF_PRODUCTS": "Manufacturing Products",
  "homePage.TOP_PRODUCTS_IMAGES": "Top Product Images",
  "homePage.OPERATIONS_AI_DATA": "AI Assistant Slides",
  "homePage.BRAND_MARQUEE_DATA": "Shop Preview Slides",
  "homePage.HERO_SLIDERS": "Hero Slides",
  "homePage.TESTIMONIALS": "Testimonial Items",
  "homePage.WALL_SHOPS": "Made With Shops",
  "homePage.seo": "SEO",
  "blogPage.blogHero": "Hero Section",
  "blogPage.featuredBlog": "Featured Post",
  "blogPage.blogs": "Blog Listing",
  "blogPage.blogDetailsArticle": "Article Details",
  "blogPage.blogDetailsAside": "Article Sidebar",
  "blogPage.blogTldrCard": "TL;DR Summary",
  "blogPage.blogFaqs": "Article FAQs",
  "blogPage.blogSocialShare": "Social Share",
  "blogPage.newsletter": "Newsletter",
  "blogPage.embed": "Embedded Content",
  "blogPage.video": "Video Player",
  "blogPage.summaryProviders": "TL;DR Summary Providers",
  "blogPage.shareProviders": "Social Share Providers",
  "blogPage.seo": "SEO",
  "blogPage.postsPerPage": "Posts Per Page",
  "navigation.header": "Header",
  "navigation.megaMenuContent": "Mega Menu",
  "navigation.NAV_ITEMS": "Main Menu Items",
  "navigation.FEATURE_GROUPS": "Features Menu Groups",
  "navigation.LEARN_CARDS": "Learn Menu Cards",
  "navigation.ELI_CARD": "Featured Menu Card",
  "navigation.APP_LINKS": "App Download Links",
  "navigation.EXPAND_LINKS": "Additional Feature Links",
  "footer.footer": "Footer Content",
  "footer.wordmark": "Wordmark",
  "footer.FOOTER_LINKS": "Link Groups",
  "footer.FOOTER_BOTTOM_LINKS": "Legal Links",
  "siteSettings.cta": "Closing CTA",
  "siteSettings.ORBIT_RINGS": "Closing CTA Product Images",
  "siteSettings.defaultSeo": "Default SEO",
  "siteSettings.globalCTA": "Global CTA",
  "siteSettings.socialLinks": "Social Links",
};
const groupFields = ["sections", "collections"];
function field(spec: Spec, doc?: string, parents: string[] = []): FieldDefinition {
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
  // Only page-level fields and direct children of sections/collections are
  // prefixed, so nested fields that share a name keep their plain title.
  const key = doc && spec.name ? `${doc}.${spec.name}` : "";
  const isSection = parents.length === 1 && groupFields.includes(parents[0]);
  const named = (isSection || parents.length === 0) && !!sectionLabels[key];
  const label = (named ? sectionLabels[key] : definition.title ?? spec.name) as string;
  if (doc && (named || isSection))
    definition.title = `${pageLabels[doc] ?? doc} – ${label}`;
  if (spec.name === "enabled") definition.initialValue = true;
  if (spec.name === "canonicalUrl") {
    definition.type = "url";
    definition.validation = (r: import("sanity").UrlRule) =>
      r.uri({ scheme: ["https", "http"] });
  }

  const childParents = spec.name ? [...parents, spec.name] : parents;
  if (fields)
    definition.fields = fields.map((child) => field(child, doc, childParents));
  if (of)
    definition.of = of.map((item) =>
      item.type === "object"
        ? {
            ...item,
            fields: item.fields?.map((child) =>
              field(child, doc, childParents),
            ),
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
                  label ||
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
    fields: (fields as Spec[]).map((spec) => field(spec, name)),
    // Singletons have no title field; without this, Studio and the Visual
    // Editor fall back to a serialized dump of the first object field.
    preview: {
      select: {},
      prepare: () => ({ title: documentTitles[name] ?? name }),
    },
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
