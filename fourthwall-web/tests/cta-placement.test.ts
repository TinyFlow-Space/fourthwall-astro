import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ctaPositions,
  wordsIn,
  type PlacementBlock,
} from "../src/lib/blog/cta-placement.ts";

const text = (words: number) => Array(words).fill("word").join(" ");
const p = (words = 100): PlacementBlock => ({
  _type: "block",
  style: "normal",
  children: [{ text: text(words) }],
});
const h2 = (): PlacementBlock => ({
  _type: "block",
  style: "h2",
  children: [{ text: "Section" }],
});
const h3 = (): PlacementBlock => ({
  _type: "block",
  style: "h3",
  children: [{ text: "Sub" }],
});
const li = (): PlacementBlock => ({
  _type: "block",
  style: "normal",
  listItem: "bullet",
  children: [{ text: "item" }],
});
const image = (): PlacementBlock => ({ _type: "image" });
const video = (): PlacementBlock => ({ _type: "videoEmbed" });
const table = (): PlacementBlock => ({
  _type: "table",
  rows: [{ cells: ["a b", "c"] }],
});
const html = (words = 0): PlacementBlock =>
  ({ _type: "htmlEmbed", html: text(words) }) as PlacementBlock;

// Sections of `paragraphs` x `words` each, every section opened by an H2.
const sections = (count: number, paragraphs = 3, words = 100) =>
  Array.from({ length: count }, () => [
    h2(),
    ...Array.from({ length: paragraphs }, () => p(words)),
  ]).flat();

test("under 2,000 words: one CTA above the H2 at or before the middle", () => {
  const body = sections(4); // 1,200 words; H2s at 0, 4, 8, 12
  assert.deepEqual(ctaPositions(body), [8]);
});

test("2,000+ words: two CTAs above the H2s before 1/3 and 2/3", () => {
  const body = sections(9); // 2,700 words; H2s every 4 blocks
  // 1/3 = 900 words -> H2 at 12 (900 words before). 2/3 = 1800 -> H2 at 24.
  assert.deepEqual(ctaPositions(body), [12, 24]);
});

test("never placed first, even if the only H2 is the opening block", () => {
  const body = [h2(), p(), p(), p()];
  const [position] = ctaPositions(body);
  assert.notEqual(position, 0);
  assert.equal(ctaPositions(body).length, 1);
});

test("skips an H2 directly after an image, video, table, list or embed", () => {
  for (const restricted of [image(), video(), table(), li(), html()]) {
    const body = [
      h2(),
      p(),
      h2(), // 2: clean
      p(),
      p(),
      restricted,
      h2(), // 6: preceded by restricted block, closest to the middle
      p(),
      p(),
      p(),
    ];
    assert.deepEqual(ctaPositions(body), [2], restricted._type);
  }
});

test("uses the closest valid H2 after the target when none is valid before", () => {
  const body = [h2(), p(), image(), h2(), p(), p(), h2(), p(), p()];
  // Middle = 250 words -> H2 at 3 is before but follows an image -> use 6.
  assert.deepEqual(ctaPositions(body), [6]);
});

test("falls back to the nearest H2 when no heading meets every rule", () => {
  const body = [p(), p(), image(), h2(), p(), p()];
  assert.deepEqual(ctaPositions(body), [3]);
});

test("H3 headings are not CTA anchors", () => {
  const body = [p(), p(), h3(), p(), p(), p()];
  // No H2: after the middle paragraph. Paragraphs are body[0,1,3,4,5]; the
  // middle one is body[3], so the CTA goes before body[4].
  assert.deepEqual(ctaPositions(body), [4]);
});

test("no H2s: one CTA after the middle paragraph", () => {
  assert.deepEqual(ctaPositions([p(), p(), p(), p(), p()]), [3]);
});

test("no H2s: avoids landing directly before media", () => {
  // Middle paragraph is body[2], but body[3] is an image -> nearest clean spot.
  const body = [p(), p(), p(), image(), p(), p()];
  const [position] = ctaPositions(body);
  assert.ok(position !== 3 && position !== 4, `got ${position}`);
});

test("two CTAs need two paragraphs between them, otherwise one in the middle", () => {
  // 2,000+ words, but the H2s around 1/3 and 2/3 are back to back.
  const body = [
    h2(),
    p(700),
    p(100),
    h2(), // 3: before 1/3
    p(50),
    h2(), // 5: before 2/3 (only one paragraph after 3)
    p(700),
    p(700),
  ];
  assert.deepEqual(ctaPositions(body), [5]);
});

test("embed content does not count toward the 2,000-word limit", () => {
  const body = [...sections(4, 3, 100), html(5000)];
  assert.equal(ctaPositions(body).length, 1);
  assert.equal(wordsIn(html(5000)), 0);
  assert.equal(wordsIn(table()), 3);
});

test("empty body gets no CTA", () => {
  assert.deepEqual(ctaPositions([]), []);
});

import { ctaHref } from "../src/lib/blog/cta-href.ts";
test("CTA link gets blog UTM parameters", () => {
  assert.equal(
    ctaHref("https://fourthwall.com/get-started/", "evan-and-katelyn-case-study"),
    "https://fourthwall.com/get-started/?utm_source=blog&utm_medium=post&utm_campaign=evan-and-katelyn-case-study",
  );
  assert.equal(
    ctaHref("https://fourthwall.com/get-started/?utm_campaign=spring", "post"),
    "https://fourthwall.com/get-started/?utm_campaign=spring&utm_source=blog&utm_medium=post",
  );
  assert.match(ctaHref("javascript:alert(1)", "post"), /^https:\/\/fourthwall\.com\/get-started\/\?/);
  assert.match(ctaHref("", "post"), /^https:\/\/fourthwall\.com\/get-started\/\?/);
});

import { removeLegacyCtas } from "../src/lib/blog/cta-placement.ts";
test("strips imported Webflow CTA text but keeps ordinary links", () => {
  const startNow = {
    _type: "block",
    style: "normal",
    children: [{ text: "Start now" }],
    markDefs: [{ href: "https://fourthwall.com/get-started/?utm_source=blog" }],
  };
  const closing = {
    _type: "block",
    style: "normal",
    children: [{ text: "If you have an audience, start now with Fourthwall." }],
    markDefs: [{ href: "https://fourthwall.com/get-started/" }],
  };
  const intro = {
    _type: "block",
    style: "normal",
    children: [{ text: "Try Fourthwall for freeCreate and sell custom products. We handle the rest." }],
  };
  const body = [p(), intro, startNow, startNow, h2(), closing];
  assert.deepEqual(removeLegacyCtas(body), [body[0], body[4], body[5]]);
});
