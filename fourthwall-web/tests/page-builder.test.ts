import { test } from "node:test";
import assert from "node:assert/strict";
import { mapSiteContent } from "../src/lib/sanity/content.ts";
import { alignClass, blocks, fileUrl, plainText, ratio, space } from "../src/lib/builder.ts";

test("page builder keeps order, keys and hidden flags", () => {
  const result = mapSiteContent({
    homePage: {
      pageBuilder: [
        { _key: "b", _type: "homeFaq" },
        { _key: "c", _type: "homeHero", hidden: true },
        { _type: "homeProducts" }, // no key: dropped
      ],
    },
  });
  assert.deepEqual(
    result.homePage.pageBuilder.map((s) => [s._key, s._type, s.hidden]),
    [["b", "homeFaq", false], ["c", "homeHero", true]],
  );
});

test("builder sections pass through raw, with nested keys and asset refs, minus stega", () => {
  const stega = "​‌‍﻿";
  const image = { _type: "image", asset: { _ref: "image-abc-1600x900-jpg", _type: "reference" } };
  const result = mapSiteContent({
    homePage: {
      pageBuilder: [
        {
          _key: "s1",
          _type: "section",
          theme: `dark${stega}`,
          content: [
            { _key: "h1", _type: "heading", text: [{ _type: "block", children: [{ text: `Hello${stega}` }] }] },
            { _key: "g1", _type: "grid", items: [{ _key: "i1", _type: "imageBlock", image }] },
          ],
        },
      ],
    },
  });
  const [section] = result.homePage.pageBuilder;
  assert.equal(section.theme, "dark");
  const content = blocks(section.content);
  assert.deepEqual(content.map((b) => b._key), ["h1", "g1"]);
  assert.equal(plainText(content[0].text), "Hello");
  const [item] = blocks(content[1].items);
  assert.equal((item.image as typeof image).asset._ref, "image-abc-1600x900-jpg");
});

test("no page builder content falls back to an empty list", () => {
  assert.deepEqual(mapSiteContent({}).homePage.pageBuilder, []);
});

test("builder helpers", () => {
  assert.equal(ratio("16/9")?.toFixed(3), "1.778");
  assert.equal(ratio("auto"), undefined);
  assert.equal(ratio("evil"), undefined);
  assert.equal(space("lg"), "24px");
  assert.equal(space(undefined), "0px");
  assert.equal(alignClass("auto"), undefined);
  assert.equal(alignClass("center"), "pb-align-center");
  assert.match(fileUrl({ asset: { _ref: "file-abc123-mp4" } }) ?? "", /^https:\/\/cdn\.sanity\.io\/files\/[^/]+\/[^/]+\/abc123\.mp4$/);
  assert.equal(fileUrl({ asset: { _ref: "image-abc-1x1-jpg" } }), undefined);
  assert.deepEqual(blocks([{ _key: "a", _type: "x" }, { _type: "nokey" }, null]).map((b) => b._key), ["a"]);
});
