import { stegaClean } from "@sanity/client/stega";
import type { SiteContent } from "../sanity/content";
import { resolveVariantId } from "./variants.ts";

export const heroVariants = {
  slider: "Hero with slider",
  static: "Hero without slider",
} as const;
export type HeroVariant = keyof typeof heroVariants;
export type HeroSlide =
  SiteContent["homePage"]["collections"]["HERO_SLIDERS"][number];
export interface HeroButton {
  enabled: boolean;
  label: string;
  url: string;
}
export interface HeroCommon {
  heading: string;
  accent: string;
  description: string;
  note: string;
  button: HeroButton;
  secondaryButton?: HeroButton;
  background?: { color?: string; image?: string };
}
export interface SliderHero extends HeroCommon {
  slides: HeroSlide[];
  previousLabel: string;
  nextLabel: string;
}
export interface StaticHero extends HeroCommon {
  image?: string;
  imageAlt: string;
  imageHref?: string;
}
export interface HeroContent {
  slider: SliderHero;
  static: StaticHero;
}
// This represents normalized CMS data. Both siblings are preserved regardless of selection.
export interface HeroVariantsConfig {
  variant?: HeroVariant;
  slider?: Partial<SliderHero>;
  static?: Partial<StaticHero>;
}
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const href = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const clean = stegaClean(value);
  if (/^\/(?!\/)/.test(clean) || clean.startsWith("#")) return clean;
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(clean).protocol)
      ? clean
      : undefined;
  } catch {
    return undefined;
  }
};
const media = (value: unknown) => {
  const url = href(value);
  return url && (/^https?:\/\//.test(url) || url.startsWith("/"))
    ? url
    : undefined;
};
function button(value: unknown, fallback?: HeroButton): HeroButton | undefined {
  if (value == null) return fallback;
  const item = record(value);
  return {
    enabled:
      typeof item.enabled === "boolean"
        ? item.enabled
        : (fallback?.enabled ?? true),
    label: text(item.label, fallback?.label),
    url: href(item.url) ?? fallback?.url ?? "",
  };
}
function common(value: unknown, fallback: HeroCommon): HeroCommon {
  const item = record(value);
  const background = record(item.background);
  const color = stegaClean(text(background.color));
  return {
    heading: text(item.heading, fallback.heading),
    accent: text(item.accent, fallback.accent),
    description: text(item.description, fallback.description),
    note: text(item.note, fallback.note),
    button: button(item.button, fallback.button)!,
    secondaryButton: button(item.secondaryButton),
    background: {
      color: /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color) ? color : undefined,
      image: media(background.image),
    },
  };
}
export function resolveHeroContent(config: unknown, fallback: HeroContent) {
  const value = record(config);
  const slider = record(value.slider);
  const staticContent = record(value.static);
  const slides = Array.isArray(slider.slides)
    ? slider.slides.flatMap((value) => {
        const item = record(value);
        const src = media(item.src);
        const type = stegaClean(text(item.type));
        return item.enabled === false ||
          !src ||
          !["img", "video"].includes(type)
          ? []
          : [
              {
                type,
                src,
                url: href(item.url) ?? "",
                title: text(item.title),
                poster: media(item.poster),
              } as HeroSlide,
            ];
      })
    : fallback.slider.slides;
  const content: HeroContent = {
    slider: {
      ...common(slider, fallback.slider),
      slides,
      previousLabel: stegaClean(
        text(slider.previousLabel, fallback.slider.previousLabel),
      ),
      nextLabel: stegaClean(text(slider.nextLabel, fallback.slider.nextLabel)),
    },
    static: {
      ...common(staticContent, fallback.static),
      image: media(staticContent.image),
      imageAlt: text(staticContent.imageAlt),
      imageHref: href(staticContent.imageHref),
    },
  };
  return {
    variant: resolveVariantId(value.variant, heroVariants, "slider"),
    content,
  };
}
export function legacyHeroContent(cms: SiteContent): HeroContent {
  const hero = cms.homePage.sections.hero;
  const common: HeroCommon = {
    heading: hero.onePlatformForPremiumProductsAnd,
    accent: hero.easyToStartReadyToGrow,
    description: "",
    note: hero.noUpfrontCostsNoCreditCard,
    button: cms.siteSettings.globalCTA,
  };
  return {
    slider: {
      ...common,
      slides: cms.homePage.collections.HERO_SLIDERS,
      previousLabel: hero.ariaLabelPrevious,
      nextLabel: hero.ariaLabelNext,
    },
    static: { ...common, imageAlt: "" },
  };
}
export function heroBackgroundStyle(background: HeroCommon["background"]) {
  if (!background?.color && !background?.image) return undefined;
  return {
    "background-color": background.color,
    "background-image": background.image
      ? `url(${JSON.stringify(background.image)})`
      : undefined,
    "background-size": background.image ? "cover" : undefined,
    "background-position": background.image ? "center" : undefined,
  };
}
