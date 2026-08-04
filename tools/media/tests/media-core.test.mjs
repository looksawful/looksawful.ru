import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  destinationFor,
  ratioToken,
  resolveSourcePath,
  rewriteProjectMedia,
} from "../media-core.mjs";

test("ratioToken returns standard ratios when dimensions are close", () => {
  assert.equal(ratioToken(1400, 935), "3x2");
  assert.equal(ratioToken(960, 1280), "3x4");
  assert.equal(ratioToken(1920, 1080), "16x9");
});

test("ratioToken returns reduced actual ratio for nonstandard dimensions", () => {
  assert.equal(ratioToken(1280, 388), "320x97");
});

test("resolveSourcePath finds a missing-extension source", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "media-core-"));
  const directory = path.join(root, "MEDIA-TEMP", "SHOOTINGS", "09");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "слайд1.webp"), "test");

  const result = resolveSourcePath({
    projectRoot: root,
    source: "./MEDIA-TEMP/SHOOTINGS/09/слайд1",
    project: "shootings",
  });

  assert.equal(result.path, path.join(directory, "слайд1.webp"));
});

test("destinationFor uses project, numeric container, position and ratio", () => {
  const destination = destinationFor(
    { project: "sands", container: "04", position: "06" },
    "9x16",
    ".webp",
  );
  assert.equal(
    destination.url,
    "./media/projects/sands/04/source/06-9x16.webp",
  );
});

test("rewriteProjectMedia updates only ordered media in the selected project", () => {
  const html = `
    <article class="cv-item">
      <span class="cv-item__project">S&amp;S</span>
      <img alt="" src="./MEDIA-TEMP/s&amp;s/a.png">
      <video src="./MEDIA-TEMP/s&amp;s/b.mp4"></video>
    </article>
  `;

  const rewritten = rewriteProjectMedia(html, [
    {
      id: "sands-01-01",
      projectLabel: "S&S",
      source: "./MEDIA-TEMP/s&s/a.png",
      targetUrl: "./media/projects/sands/01/source/01-1x1.webp",
      width: 1000,
      height: 1000,
    },
    {
      id: "sands-01-02",
      projectLabel: "S&S",
      source: "./MEDIA-TEMP/s&s/b.mp4",
      targetUrl: "./media/projects/sands/01/source/02-16x9.mp4",
      width: 1920,
      height: 1080,
    },
  ]);

  assert.match(rewritten, /data-media-id="sands-01-01"/);
  assert.match(rewritten, /src="\.\/media\/projects\/sands\/01\/source\/01-1x1\.webp"/);
  assert.match(rewritten, /width="1920" height="1080"/);
});
