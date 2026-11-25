import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { singletonTypes } from "./schemaTypes/content";
import { resolve } from "./lib/presentation";
import { publishWithUpdatedAt } from "./lib/publish-with-updated-at";
import { presentationTool } from "sanity/presentation";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId)
  throw new Error(
    "Set SANITY_STUDIO_PROJECT_ID in fourthwall-cms/.env before starting Studio.",
  );
const localPreviewUrl =
  process.env.SANITY_STUDIO_LOCAL_PREVIEW_URL || "http://localhost:4321";
const deployedPreviewUrl =
  process.env.SANITY_STUDIO_PREVIEW_URL || localPreviewUrl;

export default defineConfig({
  name: "fourthwall",
  title: "Fourthwall CMS",
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [
    structureTool({
      structure: (S) => {
        const singleton = (name: string, title: string) =>
          S.listItem()
            .title(title)
            .child(S.document().schemaType(name).documentId(name));
        return S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Global")
              .child(
                S.list()
                  .title("Global")
                  .items([
                    singleton("siteSettings", "Site Settings"),
                    singleton("navigation", "Navigation"),
                    singleton("footer", "Footer"),
                  ]),
              ),
            S.listItem()
              .title("Pages")
              .child(
                S.list()
                  .title("Pages")
                  .items([
                    singleton("homePage", "Home Page"),
                    singleton("blogPage", "Blog Page"),
                  ]),
              ),
            S.listItem()
              .title("Commerce")
              .child(
                S.list()
                  .title("Commerce")
                  .items([
                    S.documentTypeListItem("product"),
                    S.documentTypeListItem("productCategory"),
                  ]),
              ),
            S.listItem()
              .title("Blog")
              .child(
                S.list()
                  .title("Blog")
                  .items(
                    ["post", "category", "tag", "author"].map((type) =>
                      S.documentTypeListItem(type),
                    ),
                  ),
              ),
          ]);
      },
    }),

    presentationTool({
      resolve,
      // Both the local and the deployed site can be previewed (switch in the URL bar).
      allowOrigins: [...new Set([localPreviewUrl, deployedPreviewUrl])],
      previewUrl: {
        // `sanity dev` previews the local site; the deployed Studio, the deployed site.
        initial:
          process.env.NODE_ENV === "development" ? localPreviewUrl : deployedPreviewUrl,
        // Validates Presentation's secret and turns on draft previews.
        previewMode: { enable: "/api/draft-mode/enable" },
      },
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter((t) => !singletonTypes.includes(t.schemaType)),
  },
  document: {
    actions: (actions, context) =>
      singletonTypes.includes(context.schemaType)
        ? actions.filter(
            (a) =>
              !["delete", "duplicate", "unpublish"].includes(a.action || ""),
          )
        : context.schemaType === "post"
          ? actions.map((a) =>
              a.action === "publish" ? publishWithUpdatedAt(a) : a,
            )
          : actions,
    newDocumentOptions: (options) =>
      options.filter((o) => !singletonTypes.includes(o.templateId)),
  },
});
