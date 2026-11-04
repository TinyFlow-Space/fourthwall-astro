import assert from "node:assert/strict";
import test from "node:test";
import { htmlVideoUrl } from "../src/lib/blog/embeds.ts";

test("recognizes pasted YouTube iframe HTML", () => {
  const html = '<iframe width="560" height="315" src="https://www.youtube.com/embed/dsTXcSeAZq8?si=O08Rh5MUPK-NbwmP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
  assert.equal(htmlVideoUrl(html), "https://www.youtube-nocookie.com/embed/dsTXcSeAZq8");
  assert.equal(htmlVideoUrl("<iframe src='https://player.vimeo.com/video/123456'></iframe>"), "https://player.vimeo.com/video/123456");
});

test("leaves arbitrary or compound HTML in the sandbox", () => {
  for (const html of [
    '<iframe src="https://example.com/embed/dsTXcSeAZq8"></iframe>',
    '<iframe src="https://youtube.com.evil.test/embed/dsTXcSeAZq8"></iframe>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<iframe data-src="https://www.youtube.com/embed/dsTXcSeAZq8"></iframe>',
    '<iframe title=\'src="https://www.youtube.com/embed/dsTXcSeAZq8"\'></iframe>',
    '<iframe src="https://www.youtube.com/embed/dsTXcSeAZq8"></iframe><script>alert(1)</script>',
    '<div><iframe src="https://www.youtube.com/embed/dsTXcSeAZq8"></iframe></div>',
  ]) assert.equal(htmlVideoUrl(html), undefined, html);
});
