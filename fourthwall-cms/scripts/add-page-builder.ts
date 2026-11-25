/**
 * Fill the Homepage "Page sections" array with the site's current section
 * order, so sections can be reordered on the Presentation canvas.
 * Only sets the field where it is missing; never overwrites an edited order.
 *
 *   npx sanity exec scripts/add-page-builder.ts --with-user-token -- --dry
 *   npx sanity exec scripts/add-page-builder.ts --with-user-token
 */
import { randomUUID } from "node:crypto";
import { getCliClient } from "sanity/cli";
import { builtInSections } from "../schemaTypes/pageBuilder";

const client = getCliClient({ apiVersion: "2026-03-01" }).withConfig({ perspective: "raw" });
const dry = process.argv.includes("--dry");
const pageBuilder = builtInSections.map(({ name }) => ({
  _type: name,
  _key: randomUUID().replace(/-/g, "").slice(0, 12),
}));
const docs = await client.fetch<{ _id: string; count: number | null }[]>(
  `*[_id in ["homePage", "drafts.homePage"] || _id in path("versions.**.homePage")]{_id, "count": count(pageBuilder)}`,
);
const targets = docs.filter((doc) => !doc.count);
console.log("homepage documents:", docs.map((d) => `${d._id} (${d.count ?? "no"} sections)`).join(", ") || "none");
console.log("will set pageBuilder on:", targets.map((d) => d._id).join(", ") || "nothing");
console.log("order:", builtInSections.map((s) => s.title).join(" → "));
if (!dry && targets.length) {
  const tx = client.transaction();
  for (const doc of targets) tx.patch(doc._id, (p) => p.setIfMissing({ pageBuilder }));
  const result = await tx.commit({ visibility: "sync" });
  console.log("committed", result.results.length, "patch(es)");
}
