// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";

export default defineConfig({
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

  adapter: netlify({
    devFeatures: {
      images: true,
      environmentVariables: false,
      edgeFunctions: false,
    },
  }),
});
