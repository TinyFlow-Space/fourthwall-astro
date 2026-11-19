import { test } from "node:test";
import assert from "node:assert/strict";
import { isoDuration, youtubeId } from "../src/lib/blog/embeds.ts";

test("youtubeId accepts IDs and common YouTube URLs", () => {
  assert.equal(youtubeId("oGzf3esw8is"), "oGzf3esw8is");
  assert.equal(youtubeId(" oGzf3esw8is "), "oGzf3esw8is");
  assert.equal(youtubeId("https://www.youtube.com/watch?v=k_ABBzuH3ww"), "k_ABBzuH3ww");
  assert.equal(youtubeId("https://youtu.be/k_ABBzuH3ww"), "k_ABBzuH3ww");
  assert.equal(youtubeId("https://vimeo.com/12345"), undefined);
  assert.equal(youtubeId("not-an-id"), undefined);
  assert.equal(youtubeId(""), undefined);
});

test("isoDuration converts YouTube-style durations", () => {
  assert.equal(isoDuration("13:04"), "PT13M4S");
  assert.equal(isoDuration("4:13"), "PT4M13S");
  assert.equal(isoDuration("1:02:45"), "PT1H2M45S");
  assert.equal(isoDuration("1:00:00"), "PT1H");
  assert.equal(isoDuration("0:00"), "PT0S");
  assert.equal(isoDuration("4:75"), undefined);
  assert.equal(isoDuration("abc"), undefined);
});
