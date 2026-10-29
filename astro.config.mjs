// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";
import sanity from "@sanity/astro";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

export default defineConfig({
  site: env.SITE_URL || undefined,
  integrations: [
    sanity({
      // A non-routable placeholder lets the rest of the site build before setup.
      projectId: env.PUBLIC_SANITY_PROJECT_ID || "unconfigured",
      dataset: env.PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2026-03-01",
      perspective: "published",
      useCdn: true,
      injectTypes: true,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-inter",
    },
  ],

  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fourthwall.com",
        pathname: "/webflow-cdn/**",
      },
      {
        protocol: "https",
        hostname: "cdn.fourthwall.com",
        pathname: "/product-catalog/**",
      },
    ],
  },

  adapter: cloudflare(),
});
