/**
 * Decide where in-article CTAs go. Returns body indices; a CTA is rendered
 * immediately before the block at each index.
 *
 * Rules:
 * - Under 2,000 words: one CTA around the middle. 2,000+: two, around 1/3 and 2/3.
 * - Each CTA sits directly above the closest H2 before its target position.
 * - Never first, and never directly before/after media, embeds, tables or lists.
 * - Two CTAs must be separated by at least two paragraphs, otherwise one in the middle.
 * - Embed content does not count toward the word total.
 * - Fallbacks: closest valid H2 after the target, then the nearest H2 even if a
 *   neighbour rule is broken, and with no H2 at all, after the middle paragraph.
 */
export const TWO_CTA_MIN_WORDS = 2000;
const MIN_PARAGRAPHS_BETWEEN = 2;

interface Span {
  text?: unknown;
}
export interface PlacementBlock {
  _type: string;
  style?: string;
  listItem?: string;
  children?: Span[];
  rows?: { cells?: unknown[] }[];
}

const countWords = (text: string) =>
  text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
const blockText = (block: PlacementBlock) =>
  (block.children ?? [])
    .map((child) => (typeof child.text === "string" ? child.text : ""))
    .join("");

/** Words a reader sees in the article body; custom embeds are excluded. */
export function wordsIn(block: PlacementBlock): number {
  if (block._type === "block") return countWords(blockText(block));
  if (block._type === "table")
    return (block.rows ?? [])
      .flatMap((row) => row.cells ?? [])
      .reduce<number>(
        (sum, cell) => sum + (typeof cell === "string" ? countWords(cell) : 0),
        0,
      );
  return 0;
}
const isH2 = (block?: PlacementBlock) =>
  block?._type === "block" && block.style === "h2" && !block.listItem;
const isParagraph = (block?: PlacementBlock) =>
  block?._type === "block" &&
  (!block.style || block.style === "normal") &&
  !block.listItem &&
  blockText(block).trim() !== "";
/** Images, videos, social/HTML/script embeds, tables and list items. */
const isRestricted = (block?: PlacementBlock) =>
  !!block && (block._type !== "block" || !!block.listItem);

export function ctaPositions(body: PlacementBlock[]): number[] {
  if (!body.length) return [];
  const before: number[] = [0];
  for (const block of body) before.push(before.at(-1)! + wordsIn(block));
  const total = before[body.length];

  // A position is valid when it is not first and has no restricted neighbour.
  const valid = (index: number) =>
    index > 0 && !isRestricted(body[index - 1]) && !isRestricted(body[index]);
  // An H2 at index 0 cannot take a CTA without putting it first.
  const headings = body
    .map((block, index) => (isH2(block) && index > 0 ? index : -1))
    .filter((index) => index > 0);

  const aboveHeading = (fraction: number): number => {
    const target = total * fraction;
    const earlier = headings.filter((i) => before[i] <= target && valid(i));
    if (earlier.length) return earlier.at(-1)!;
    const later = headings.find((i) => before[i] > target && valid(i));
    if (later !== undefined) return later;
    // Never missing: nearest heading, even if a neighbour rule is broken.
    return headings.reduce((best, i) =>
      Math.abs(before[i] - target) < Math.abs(before[best] - target) ? i : best,
    );
  };

  if (!headings.length) return [afterMiddleParagraph(body, valid)];

  const middle = aboveHeading(1 / 2);
  if (total < TWO_CTA_MIN_WORDS) return [middle];
  const first = aboveHeading(1 / 3);
  const second = aboveHeading(2 / 3);
  const paragraphsBetween = body
    .slice(first, second)
    .filter((block) => isParagraph(block)).length;
  return first < second && paragraphsBetween >= MIN_PARAGRAPHS_BETWEEN
    ? [first, second]
    : [middle];
}

/** No H2s: after the middle paragraph, preferring one with no restricted neighbour. */
function afterMiddleParagraph(
  body: PlacementBlock[],
  valid: (index: number) => boolean,
): number {
  const paragraphs = body
    .map((block, index) => (isParagraph(block) ? index : -1))
    .filter((index) => index >= 0);
  if (!paragraphs.length) return Math.max(1, Math.ceil(body.length / 2));
  const middle = Math.floor((paragraphs.length - 1) / 2);
  // Search outward from the middle paragraph for a clean insertion point.
  for (let offset = 0; offset < paragraphs.length; offset++) {
    for (const candidate of [middle - offset, middle + offset]) {
      const paragraph = paragraphs[candidate];
      if (paragraph !== undefined && valid(paragraph + 1)) return paragraph + 1;
    }
  }
  return paragraphs[middle] + 1;
}

// Posts imported from Webflow carry the old CTA as plain body text: a short
// "Try Fourthwall for free…" paragraph followed by "Start now" link paragraphs.
// The rendered CTA replaces them, so they are dropped before placement.
const INVISIBLE = /[​-‏⁠-⁯﻿\u{e0000}-\u{e007f}]/gu;
const plain = (block: PlacementBlock) =>
  blockText(block).replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
const isLegacyCtaIntro = (block: PlacementBlock) =>
  isParagraph(block) &&
  /^try fourthwall for free/i.test(plain(block)) &&
  plain(block).length <= 200;
const isLegacyCtaButton = (block: PlacementBlock & { markDefs?: { href?: unknown }[] }) =>
  isParagraph(block) &&
  /^start now$/i.test(plain(block)) &&
  (block.markDefs ?? []).some(
    (mark) => typeof mark.href === "string" && /fourthwall\.com\/get-started/.test(mark.href.replace(INVISIBLE, "")),
  );

export function removeLegacyCtas<T extends PlacementBlock>(body: T[]): T[] {
  return body.filter(
    (block) => !isLegacyCtaIntro(block) && !isLegacyCtaButton(block),
  );
}
