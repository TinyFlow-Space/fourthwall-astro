import test from "node:test";
import assert from "node:assert/strict";
import {
  videoUrl,
  socialUrl,
  httpsUrl,
  embedDocument,
} from "../src/lib/blog/embeds.ts";
test("video providers are normalized and unrelated hosts rejected", () => {
  for (const url of [
    "https://youtu.be/XR1BVetyGbA",
    "https://www.youtube.com/watch?v=XR1BVetyGbA",
    "https://youtube.com/shorts/XR1BVetyGbA",
    "https://www.youtube.com/embed/XR1BVetyGbA",
  ])
    assert.equal(
      videoUrl(url),
      "https://www.youtube-nocookie.com/embed/XR1BVetyGbA",
    );
  assert.equal(
    videoUrl("https://vimeo.com/123456"),
    "https://player.vimeo.com/video/123456",
  );
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=XR1BVetyGbA",
    "https://user:pass@youtube.com/watch?v=XR1BVetyGbA",
    "https://youtube.com/watch?v=bad",
  ])
    assert.equal(videoUrl(url), undefined);
});
test("social posts preserve carousel identity and strip tracking", () => {
  assert.equal(
    socialUrl("https://www.instagram.com/p/C_gsS3AyJmV/?utm_source=ig_embed"),
    "https://www.instagram.com/p/C_gsS3AyJmV/embed/",
  );
  assert.equal(
    socialUrl("https://open.spotify.com/track/abc123"),
    "https://open.spotify.com/embed/track/abc123",
  );
  assert.equal(socialUrl("https://instagram.com/accounts/login"), undefined);
});
test("HTML document blocks inline scripts and escapes script attributes", () => {
  assert.match(embedDocument("<p>Content</p>"), /script-src &#39;none&#39;/);
  assert.match(
    embedDocument("<div></div>", "https://example.com/embed.js?a=1&b=2"),
    /src="https:\/\/example.com\/embed.js\?a=1&amp;b=2"/,
  );
  assert.doesNotMatch(
    embedDocument("test", "javascript:alert(1)"),
    /<script async/,
  );
  assert.equal(httpsUrl("//example.com"), undefined);
});
