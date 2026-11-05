// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

export default defineConfig({
  site: env.SITE_URL || undefined,
  vite: {
    cacheDir: ".astro/vite",
    plugins: [tailwindcss()],
  },

  image: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
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
