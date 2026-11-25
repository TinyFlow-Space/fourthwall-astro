// @sanity/icons 5.4+ exposes each icon from its own entry point.
import { BasketIcon } from "@sanity/icons/Basket";
import { ColorWheelIcon } from "@sanity/icons/ColorWheel";
import { CommentIcon } from "@sanity/icons/Comment";
import { CogIcon } from "@sanity/icons/Cog";
import { HeartIcon } from "@sanity/icons/Heart";
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { ImagesIcon } from "@sanity/icons/Images";
import { StarIcon } from "@sanity/icons/Star";
import { TagIcon } from "@sanity/icons/Tag";
import { ThListIcon } from "@sanity/icons/ThList";
import { UsersIcon } from "@sanity/icons/Users";
import { builderTypes } from "./builder/blocks";
import {
  defineArrayMember,
  defineField,
  defineType,
  type ArrayRule,
} from "sanity";

/**
 * Homepage page builder. The array order is the order sections render in, and
 * the Presentation tool can drag-reorder, insert, duplicate and remove items.
 *
 * The site's existing sections keep their copy under "Section text and links"
 * and "Images and lists"; their builder items only control order and
 * visibility. "Section" is composed from building blocks (see ./builder).
 */
export const builtInSections = [
  { name: "homeHero", section: "hero", title: "Hero", icon: StarIcon },
  { name: "homeFeaturedProducts", section: "featuredProducts", title: "Featured Products", icon: BasketIcon },
  { name: "homeTrustedBrands", section: "trustedBrands", title: "Trusted Brands", icon: TagIcon },
  { name: "homeBrandShowcase", section: "brandShowcase", title: "Brand Showcase", icon: ImagesIcon },
  { name: "homeProductDesign", section: "productDesign", title: "Product Design", icon: ColorWheelIcon },
  { name: "homeOperations", section: "operations", title: "Operations", icon: CogIcon },
  { name: "homeTestimonials", section: "testimonials", title: "Testimonials", icon: CommentIcon },
  { name: "homeProducts", section: "products", title: "Products", icon: ThListIcon },
  { name: "homeCreators", section: "creators", title: "Creators", icon: UsersIcon },
  { name: "homeMadeWith", section: "madeWith", title: "Made With Fourthwall", icon: HeartIcon },
  { name: "homeFaq", section: "faq", title: "FAQ", icon: HelpCircleIcon },
] as const;

const hiddenField = defineField({
  name: "hidden",
  title: "Hide on site",
  type: "boolean",
  initialValue: false,
});

const builtInTypes = builtInSections.map(({ name, title, icon }) =>
  defineType({
    name,
    title,
    type: "object",
    icon,
    description: `Edit its text under "Section text and links → Homepage – ${title}" (or click the text on the canvas).`,
    fields: [hiddenField],
    preview: {
      select: { hidden: "hidden" },
      prepare: ({ hidden }) => ({
        title,
        subtitle: hidden ? "Hidden" : "Homepage section",
        media: icon,
      }),
    },
  }),
);

export const pageBuilderTypes = [...builtInTypes, ...builderTypes];

export const pageBuilderField = defineField({
  name: "pageBuilder",
  title: "Page sections",
  description:
    "Sections in the order they appear. Drag to reorder here or on the canvas in Presentation; right-click a section there to insert, duplicate or remove.",
  type: "array",
  of: [
    ...builtInSections.map(({ name }) => defineArrayMember({ type: name })),
    defineArrayMember({ type: "section" }),
  ],
  // The site's own sections share one set of content, so each appears once.
  validation: (rule: ArrayRule<{ _type: string }[]>) =>
    rule.custom((items) => {
      const seen = new Set<string>();
      for (const item of items ?? []) {
        if (item._type === "section") continue;
        if (seen.has(item._type))
          return `"${builtInSections.find((s) => s.name === item._type)?.title ?? item._type}" can only be added once.`;
        seen.add(item._type);
      }
      return true;
    }),
});
