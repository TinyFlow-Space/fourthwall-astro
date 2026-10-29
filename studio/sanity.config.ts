import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId)
  throw new Error(
    "Set SANITY_STUDIO_PROJECT_ID in studio/.env before starting Studio.",
  );
export default defineConfig({
  name: "fourthwall",
  title: "Fourthwall Blog",
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
