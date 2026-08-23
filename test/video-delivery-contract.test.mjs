import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("optimized Sensetique video keeps the MOV master while serving the generated MP4", async () => {
  const [mediaTypes, assets, content, builder, integrity] = await Promise.all([
    read("src/types/media.ts"),
    read("src/data/media/assets/sensetique.ts"),
    read("src/data/content/sensetique.ts"),
    read("tools/build-video-media.mjs"),
    read("tools/check-data-integrity.ts"),
  ]);

  assert.match(mediaTypes, /interface VideoMedia[\s\S]*sourceSrc\?: string/);
  assert.match(
    assets,
    /id: "sensetique-11-source-97-16x9"[\s\S]*src: "\/media\/generated\/video\/projects\/sensetique\/11\/source\/97-16x9\.web\.mp4"[\s\S]*sourceSrc: "\/media\/projects\/sensetique\/11\/source\/97-16x9\.mov"/,
  );
  assert.doesNotMatch(content, /sensetique-11-source-97-16x9-use-02[\s\S]{0,500}video\/quicktime/);
  assert.match(builder, /asset\.sourceSrc \?\? asset\.src/);
  assert.match(integrity, /sourceSrc/);

  await access(new URL("../public/media/generated/video/projects/sensetique/11/source/97-16x9.web.mp4", import.meta.url));
});
