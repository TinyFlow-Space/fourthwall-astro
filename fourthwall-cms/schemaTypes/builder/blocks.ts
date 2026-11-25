import { BlockContentIcon } from "@sanity/icons/BlockContent";
import { ImageIcon } from "@sanity/icons/Image";
import { InlineIcon } from "@sanity/icons/Inline";
import { LinkIcon } from "@sanity/icons/Link";
import { MasterDetailIcon } from "@sanity/icons/MasterDetail";
import { MenuIcon } from "@sanity/icons/Menu";
import { PlayIcon } from "@sanity/icons/Play";
import { SquareIcon } from "@sanity/icons/Square";
import { StackIcon } from "@sanity/icons/Stack";
import { TextIcon } from "@sanity/icons/Text";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineArrayMember, defineField, defineType } from "sanity";
import {
  alignField,
  choiceField,
  colorField,
  linkFields,
  plainText,
  responsiveNumberField,
  richTextField,
  sliderField,
  spacingField,
} from "./fields";

/**
 * Composable building blocks for the page builder. A Section holds any block;
 * Card, Grid, Slider and Button Group hold blocks of their own, so sections can
 * be composed from scratch on the Presentation canvas.
 */
const members = (...types: string[]) => types.map((type) => defineArrayMember({ type }));
const TEXT_BLOCKS = ["eyebrow", "heading", "paragraph", "button", "buttonGroup"];
const MEDIA_BLOCKS = ["imageBlock", "loopingVideo"];
export const sectionMembers = () =>
  members(...TEXT_BLOCKS, ...MEDIA_BLOCKS, "card", "grid", "slider");

const ASPECT_RATIOS: [string, string][] = [
  ["auto", "Auto (natural)"],
  ["1/1", "1:1 Square"],
  ["4/3", "4:3"],
  ["3/2", "3:2"],
  ["16/9", "16:9"],
  ["21/9", "21:9 Ultrawide"],
  ["3/4", "3:4 Portrait"],
  ["9/16", "9:16 Vertical"],
];
const fitField = choiceField("objectFit", "Fit", [["cover", "Cover"], ["contain", "Contain"]], "cover", "radio", {
  hidden: ({ parent }) => (parent as { aspectRatio?: string } | undefined)?.aspectRatio === "auto",
});

export const eyebrow = defineType({
  name: "eyebrow",
  title: "Eyebrow",
  type: "object",
  icon: InlineIcon,
  fields: [
    defineField({ name: "text", type: "string", initialValue: "Eyebrow", validation: (r) => r.required() }),
    choiceField("size", "Size", [["xs", "XS"], ["sm", "Small"], ["md", "Medium"]], "sm"),
    colorField("muted"),
    alignField(),
    spacingField("marginBottom", "Space below"),
  ],
  preview: { select: { title: "text" }, prepare: ({ title }) => ({ title: title || "Eyebrow", subtitle: "Eyebrow" }) },
});

export const heading = defineType({
  name: "heading",
  title: "Heading",
  type: "object",
  icon: TextIcon,
  fields: [
    richTextField("A clear, confident headline"),
    choiceField("level", "Semantic level", ["h1", "h2", "h3", "h4", "h5", "h6"].map((v) => [v, v.toUpperCase()]), "h2", "dropdown", {
      description: "The HTML tag (for SEO and accessibility). Visual size is separate.",
    }),
    choiceField("size", "Visual size", [["sm", "S"], ["md", "M"], ["lg", "L"], ["xl", "XL"], ["2xl", "2XL"], ["3xl", "3XL"], ["4xl", "Display"]], "xl"),
    choiceField("weight", "Weight", [["light", "Light"], ["regular", "Regular"], ["medium", "Medium"]], "regular"),
    colorField("default"),
    alignField(),
    sliderField({ name: "maxWidth", title: "Max width", description: "Line length in characters.", min: 8, max: 60, suffix: "ch", allowUnset: true, unsetLabel: "Full" }),
    spacingField("marginBottom", "Space below"),
  ],
  preview: {
    select: { text: "text", level: "level", size: "size" },
    prepare: ({ text, level, size }) => ({ title: plainText(text) || "Heading", subtitle: `Heading · ${level ?? "h2"} · ${size ?? "xl"}` }),
  },
});

export const paragraph = defineType({
  name: "paragraph",
  title: "Paragraph",
  type: "object",
  icon: BlockContentIcon,
  fields: [
    richTextField("Supporting copy that explains the idea in a sentence or two."),
    choiceField("size", "Size", [["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "XL"]], "md"),
    colorField("muted"),
    alignField(),
    sliderField({ name: "maxWidth", title: "Max width", description: "Line length in characters.", min: 20, max: 100, suffix: "ch", allowUnset: true, unsetLabel: "Full", initialValue: 60 }),
    spacingField("marginBottom", "Space below"),
  ],
  preview: { select: { text: "text" }, prepare: ({ text }) => ({ title: plainText(text) || "Paragraph", subtitle: "Paragraph" }) },
});

const buttonFields = [
  defineField({ name: "label", type: "string", initialValue: "Get started", validation: (r) => r.required() }),
  ...linkFields,
  choiceField("style", "Style", [["primary", "Primary"], ["secondary", "Secondary"], ["outline", "Outline"], ["ghost", "Ghost"], ["link", "Link"]], "primary", "dropdown"),
  choiceField("size", "Size", [["sm", "S"], ["md", "M"], ["lg", "L"], ["xl", "XL"]], "md"),
  defineField({ name: "fullWidth", title: "Full width", type: "boolean", initialValue: false }),
];
export const button = defineType({
  name: "button",
  title: "Button",
  type: "object",
  icon: LinkIcon,
  fields: [...buttonFields, alignField()],
  preview: { select: { title: "label", style: "style" }, prepare: ({ title, style }) => ({ title: title || "Button", subtitle: `Button · ${style ?? "primary"}` }) },
});

export const buttonGroup = defineType({
  name: "buttonGroup",
  title: "Button Group",
  type: "object",
  icon: MenuIcon,
  fields: [
    defineField({
      name: "buttons",
      type: "array",
      of: [defineArrayMember({ name: "groupButton", type: "object", title: "Button", icon: LinkIcon, fields: buttonFields, preview: { select: { title: "label", subtitle: "style" } } })],
      validation: (r) => r.min(1),
    }),
    choiceField("direction", "Direction", [["row", "Row"], ["column", "Column"]], "row"),
    alignField(),
    defineField({ name: "wrap", title: "Wrap to new line", type: "boolean", initialValue: true }),
    sliderField({ name: "gap", title: "Gap", min: 0, max: 48, step: 2, suffix: "px", initialValue: 12 }),
    spacingField("marginBottom", "Space below"),
  ],
  preview: { select: { buttons: "buttons" }, prepare: ({ buttons }) => ({ title: "Button Group", subtitle: `${buttons?.length ?? 0} button(s)` }) },
});

export const imageBlock = defineType({
  name: "imageBlock",
  title: "Image",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
      fields: [defineField({ name: "alt", title: "Alternative text", type: "string" })],
    }),
    choiceField("aspectRatio", "Aspect ratio", ASPECT_RATIOS, "16/9", "dropdown"),
    fitField,
    sliderField({ name: "radius", title: "Corner radius", min: 0, max: 48, suffix: "px", initialValue: 12 }),
    sliderField({ name: "maxWidth", title: "Max width", min: 120, max: 1400, step: 8, suffix: "px", allowUnset: true, unsetLabel: "Full" }),
  ],
  preview: { select: { media: "image", alt: "image.alt" }, prepare: ({ media, alt }) => ({ title: alt || "Image", subtitle: "Image", media }) },
});

export const loopingVideo = defineType({
  name: "loopingVideo",
  title: "Looping Video",
  type: "object",
  icon: PlayIcon,
  fields: [
    defineField({ name: "videoFile", title: "Video file", type: "file", options: { accept: "video/mp4,video/webm" }, description: "MP4 or WebM. Keep it short and small — it loops muted." }),
    defineField({ name: "externalUrl", title: "…or video URL", type: "url", description: "Used when no file is uploaded.", validation: (r) => r.uri({ scheme: ["https"] }) }),
    defineField({ name: "poster", title: "Poster image", type: "image", options: { hotspot: true } }),
    choiceField("aspectRatio", "Aspect ratio", ASPECT_RATIOS, "16/9", "dropdown"),
    fitField,
    defineField({ name: "autoplay", type: "boolean", initialValue: true }),
    sliderField({ name: "radius", title: "Corner radius", min: 0, max: 48, suffix: "px", initialValue: 12 }),
    sliderField({ name: "maxWidth", title: "Max width", min: 120, max: 1400, step: 8, suffix: "px", allowUnset: true, unsetLabel: "Full" }),
  ],
  preview: { select: { media: "poster", file: "videoFile.asset.originalFilename" }, prepare: ({ media, file }) => ({ title: "Looping Video", subtitle: file || "Autoplay · muted · loop", media }) },
});

export const card = defineType({
  name: "card",
  title: "Card",
  type: "object",
  icon: SquareIcon,
  fields: [
    defineField({ name: "content", type: "array", of: members(...TEXT_BLOCKS, ...MEDIA_BLOCKS) }),
    choiceField("variant", "Variant", [["surface", "Surface"], ["elevated", "Elevated"], ["outline", "Outline"], ["ghost", "Ghost"], ["brand", "Brand"]], "surface", "radio", {
      description: "Brand re-themes everything inside the card.",
    }),
    sliderField({ name: "padding", title: "Padding", min: 0, max: 64, step: 2, suffix: "px", initialValue: 28 }),
    sliderField({ name: "gap", title: "Gap between blocks", min: 0, max: 48, step: 2, suffix: "px", initialValue: 12 }),
    sliderField({ name: "radius", title: "Corner radius", min: 0, max: 40, suffix: "px", initialValue: 14 }),
    { ...linkFields[0], description: "Optional. Makes the whole card clickable." },
    linkFields[1],
  ],
  preview: {
    select: { content: "content", variant: "variant" },
    prepare: ({ content, variant }) => {
      const first = (content ?? []).find((b: { _type: string }) => b._type === "heading");
      return { title: plainText(first?.text) || "Card", subtitle: `Card · ${variant ?? "surface"} · ${content?.length ?? 0} block(s)` };
    },
  },
});

export const grid = defineType({
  name: "grid",
  title: "Grid",
  type: "object",
  icon: ThLargeIcon,
  fields: [
    defineField({ name: "items", type: "array", of: members("card", ...MEDIA_BLOCKS, ...TEXT_BLOCKS) }),
    responsiveNumberField({ name: "columns", title: "Columns", min: 1, max: 6, initialValue: { mobile: 1, tablet: 2, desktop: 3 } }),
    sliderField({ name: "columnGap", title: "Column gap", min: 0, max: 80, step: 2, suffix: "px", initialValue: 24 }),
    sliderField({ name: "rowGap", title: "Row gap", min: 0, max: 80, step: 2, suffix: "px", initialValue: 24 }),
    choiceField("alignItems", "Vertical alignment", [["stretch", "Stretch"], ["start", "Top"], ["center", "Center"], ["end", "Bottom"]], "stretch"),
  ],
  preview: { select: { items: "items", cols: "columns.desktop" }, prepare: ({ items, cols }) => ({ title: "Grid", subtitle: `${items?.length ?? 0} item(s) · ${cols ?? 3} columns` }) },
});

export const slider = defineType({
  name: "slider",
  title: "Slider",
  type: "object",
  icon: StackIcon,
  fields: [
    defineField({ name: "slides", type: "array", of: members("card", ...MEDIA_BLOCKS) }),
    responsiveNumberField({ name: "slidesPerView", title: "Slides per view", min: 1, max: 5, initialValue: { mobile: 1, tablet: 2, desktop: 3 } }),
    sliderField({ name: "gap", title: "Gap between slides", min: 0, max: 64, step: 2, suffix: "px", initialValue: 24 }),
    defineField({ name: "loop", type: "boolean", initialValue: true }),
    defineField({ name: "showArrows", title: "Show arrows", type: "boolean", initialValue: true }),
    defineField({ name: "showDots", title: "Show dots", type: "boolean", initialValue: true }),
  ],
  preview: { select: { slides: "slides", perView: "slidesPerView.desktop" }, prepare: ({ slides, perView }) => ({ title: "Slider", subtitle: `${slides?.length ?? 0} slide(s) · ${perView ?? 3} per view` }) },
});

export const section = defineType({
  name: "section",
  title: "Section",
  type: "object",
  icon: MasterDetailIcon,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "styles", title: "Styles" },
  ],
  fields: [
    defineField({ name: "name", title: "Internal name", type: "string", group: "content", initialValue: "Section", description: "Only shown in the Studio." }),
    defineField({ name: "content", type: "array", group: "content", of: sectionMembers() }),
    { ...choiceField("theme", "Theme", [["light", "Light"], ["dark", "Dark"], ["brand", "Brand"]], "light", "radio", { description: "Cascades colors to every block inside." }), group: "styles" },
    sliderField({ name: "paddingTop", title: "Padding top", group: "styles", min: 0, max: 240, step: 8, suffix: "px", initialValue: 96 }),
    sliderField({ name: "paddingBottom", title: "Padding bottom", group: "styles", min: 0, max: 240, step: 8, suffix: "px", initialValue: 96 }),
    sliderField({ name: "gap", title: "Gap between blocks", group: "styles", min: 0, max: 80, step: 2, suffix: "px", initialValue: 16 }),
    sliderField({ name: "maxWidth", title: "Container max width", group: "styles", min: 480, max: 1600, step: 20, suffix: "px", initialValue: 1240 }),
    { ...choiceField("contentAlign", "Horizontal alignment", [["start", "Left"], ["center", "Center"], ["end", "Right"]], "start"), group: "styles" },
    defineField({ name: "fullHeight", title: "Full viewport height", type: "boolean", group: "styles", initialValue: false, description: "Great for heroes." }),
    {
      ...choiceField("verticalAlign", "Vertical alignment", [["start", "Top"], ["center", "Center"], ["end", "Bottom"]], "center", "radio", {
        hidden: ({ parent }) => !(parent as { fullHeight?: boolean } | undefined)?.fullHeight,
      }),
      group: "styles",
    },
    defineField({ name: "backgroundImage", title: "Background image", type: "image", group: "styles", options: { hotspot: true } }),
    sliderField({
      name: "overlayOpacity",
      title: "Overlay opacity",
      description: "Darkens the background image so text stays readable.",
      group: "styles",
      min: 0,
      max: 90,
      step: 5,
      suffix: "%",
      initialValue: 40,
      hidden: ({ parent }) => !(parent as { backgroundImage?: { asset?: unknown } } | undefined)?.backgroundImage?.asset,
    }),
    defineField({ name: "hidden", title: "Hide on site", type: "boolean", group: "content", initialValue: false }),
  ],
  preview: {
    select: { name: "name", theme: "theme", content: "content", hidden: "hidden" },
    prepare: ({ name, theme, content, hidden }) => ({
      title: name || "Section",
      subtitle: [hidden ? "Hidden" : "", `Section · ${theme ?? "light"} · ${content?.length ?? 0} block(s)`].filter(Boolean).join(" · "),
    }),
  },
});

export const builderTypes = [section, eyebrow, heading, paragraph, button, buttonGroup, imageBlock, loopingVideo, card, grid, slider];
