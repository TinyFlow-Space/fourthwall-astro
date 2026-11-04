import { createClient } from "@sanity/client";
import { readFile } from "node:fs/promises";
const documents = JSON.parse(
  await readFile(new URL("../seed/content.json", import.meta.url), "utf8"),
) as { _id: string; _type: string }[];
const apply = process.argv.includes("--apply");
console.log(
  `${documents.length} documents: ${documents.map((d) => d._id).join(", ")}`,
);
if (!apply) {
  console.log(
    "Dry run only. Use npm run seed -- --apply to create missing documents. Existing documents are never replaced.",
  );
  process.exit(0);
}
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const token = process.env.SANITY_API_WRITE_TOKEN;
const useLogin = process.argv.includes("--cli");
if (!useLogin && (!projectId || !token))
  throw new Error(
    "Set SANITY_STUDIO_PROJECT_ID and server-only SANITY_API_WRITE_TOKEN. Never use a SANITY_STUDIO_ prefix for the token.",
  );
const client = useLogin
  ? (await import("sanity/cli")).getCliClient({ apiVersion: "2026-03-01", useCdn: false })
  : createClient({
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  token,
  apiVersion: "2026-03-01",
  useCdn: false,
});
let transaction = client.transaction();
for (const document of documents)
  transaction = transaction.createIfNotExists(document);
await transaction.commit();
console.log(
  "Created missing singleton, category and product documents. Existing content was preserved.",
);
