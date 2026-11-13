import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import type { HeroVariant } from "@/lib/sections/hero";
import Slider from "./slider.astro";
import Static from "./static.astro";

export const heroComponents = {
  slider: Slider,
  static: Static,
} satisfies Record<HeroVariant, AstroComponentFactory>;
