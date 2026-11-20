// Public Sanity settings. None of these are secrets (the project ID appears in
// every image URL), so they have committed defaults: deployments work without
// build variables, and environment variables still override them.
const env = import.meta.env ?? {};
export const sanityProjectId: string =
  env.PUBLIC_SANITY_PROJECT_ID || "r1i36yri";
export const sanityDataset: string = env.PUBLIC_SANITY_DATASET || "production";
export const sanityStudioUrl: string =
  env.PUBLIC_SANITY_STUDIO_URL ||
  (env.DEV ? "http://localhost:3333" : "https://fourthwall-cms.sanity.studio");
