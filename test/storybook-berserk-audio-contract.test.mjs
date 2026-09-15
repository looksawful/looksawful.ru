import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const storyUrl = new URL("../src/lab/stories/berserk-audio-player.stories.js", import.meta.url);

test("Storybook exposes the production Berserk audio player as a canonical organism fixture", async () => {
  const story = await readFile(storyUrl, "utf8");

  assert.match(story, /createBerserkAudioPlayer/);
  assert.match(story, /data-berserk-audio-player/);
  assert.match(story, /data-audio-play/);
  assert.match(story, /data-audio-progress/);
  assert.match(story, /data-audio-volume/);
  assert.match(story, /data-audio-sound/);
  assert.match(story, /layer:\s*["']organism["']/);
  assert.match(story, /policy:\s*["']behavior-fixture["']/);
  assert.match(story, /canonical:\s*true/);
  assert.match(story, /ready/);
  assert.match(story, /sound-selected/);
  assert.match(story, /review:\s*\[["']desktop["'],\s*["']tablet["'],\s*["']mobile["']\]/);
});
