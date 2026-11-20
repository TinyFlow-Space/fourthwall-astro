import { defineCliConfig } from "sanity/cli";
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  // Hosted at https://fourthwall-cms.sanity.studio (`npx sanity deploy`).
  studioHost: "fourthwall-cms",
  deployment: { appId: "me0gx2r6q9xp2q9a1swao9mz" },
});
