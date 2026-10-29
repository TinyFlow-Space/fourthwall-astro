import type { PortableTextBlock } from "@portabletext/types";
import type { BodyBlock } from "./types";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export function isHeadingLevel(style?: string): style is HeadingLevel {
  return /^h[1-6]$/.test(style ?? "");
}
export function headingText(
  block: Pick<PortableTextBlock, "children">,
): string {
  return block.children
    .map((child) => (typeof child.text === "string" ? child.text : ""))
    .join("");
}
export function headingId(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .trim()
      // Convert whitespace before removing punctuation: "Rhett & Link" -> "rhett--link".
      .replace(/\s+/g, "-")
      .replace(/[\u2010-\u2015]/g, "-")
      .replace(/[^\p{L}\p{N}_-]/gu, "")
      .replace(/^-+|-+$/g, "") || "heading"
  );
}

/** Assign IDs once per body traversal, without mutating Sanity data or sharing counters between requests. */
export function prepareHeadings(body: BodyBlock[]) {
  const used = new Set<string>();
  const headings: { depth: number; slug: string; text: string }[] = [];
  const blocks = body.map((block) => {
    if (
      block._type !== "block" ||
      !("children" in block) ||
      !isHeadingLevel(block.style)
    )
      return block;
    const text = headingText(block);
    const base = headingId(text);
    let slug = base;
    let suffix = 2;
    // Also avoids collisions with literal headings such as "Introduction-2".
    while (used.has(slug)) slug = `${base}-${suffix++}`;
    used.add(slug);
    headings.push({ depth: Number(block.style.slice(1)), slug, text });
    return { ...block, headingId: slug };
  });
  return { blocks, headings };
}
export function getHeadings(body: BodyBlock[]) {
  return prepareHeadings(body).headings;
}
