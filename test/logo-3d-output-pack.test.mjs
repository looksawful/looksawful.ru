import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const manifest = JSON.parse(await readFile(new URL("../tools/logo-3d/logo-3d-manifest.json", import.meta.url), "utf8"));
const generated = manifest.targets.filter((target) =>
  target.sourceType === "vector-svg" && target.status === "ready",
);

const signatures = new Map([
  ["glb", Buffer.from("glTF")],
  ["fbx", Buffer.from("Kaydara FBX Binary")],
  ["png", Buffer.from([0x89, 0x50, 0x4e, 0x47])],
]);
for (const target of generated) {
  test(`production pack is complete: ${target.id}`, async () => {
    const glbRel = target.packOutput ?? target.output;
    const glbPath = path.join(repoRoot, glbRel);
    const dir = path.dirname(glbPath);
    const stem = path.basename(glbPath, ".glb");

    for (const ext of manifest.exportFormats) {
      const file = path.join(dir, `${stem}.${ext}`);
      const info = await stat(file);
      assert.ok(info.size > 128, `${target.id} ${ext} is unexpectedly small`);
      if (signatures.has(ext)) {
        const body = await readFile(file);
        assert.equal(body.subarray(0, signatures.get(ext).length).compare(signatures.get(ext)), 0);
      }
    }

    const png = await readFile(path.join(dir, "preview", `${stem}.png`));
    assert.equal(png.subarray(0, 4).compare(signatures.get("png")), 0);
    const metadata = JSON.parse(await readFile(path.join(dir, "metadata", `${stem}.json`), "utf8"));
    assert.equal(metadata.id, target.id);
    assert.match(metadata.sourceSha256, /^[0-9a-f]{64}$/);
    assert.equal(metadata.sourceType, "vector-svg");
    assert.equal(metadata.geometryProfile, manifest.defaultGeometryProfile);
    assert.equal(metadata.dimensions[1], 0.38);
    assert.ok(Math.abs(Math.max(metadata.dimensions[0], metadata.dimensions[2]) - 2) < 0.001);
  });
}
