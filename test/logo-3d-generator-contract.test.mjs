import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const manifestUrl = new URL("../tools/logo-3d/logo-3d-manifest.json", import.meta.url);
const generatorUrl = new URL("../tools/logo-3d/generate-logo-3d.py", import.meta.url);

test("logo 3d generation uses the measured latest Jestei depth profile", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const profile = manifest.geometryProfiles?.[manifest.defaultGeometryProfile];

  assert.ok(profile, "missing default geometry profile");
  assert.equal(profile.referenceModel, "public/media/projects/jestei/model-viewer/jestei-logo-web.glb");
  assert.equal(profile.frontSpan, 2);
  assert.equal(profile.depth, 0.38);
  assert.equal(profile.depthRatio, 0.19);
});

test("Blender generator exists and all vector targets have unique outputs", async () => {
  await access(generatorUrl);
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const vectorTargets = manifest.targets.filter((target) => target.sourceType === "vector-svg");
  const outputs = vectorTargets.map((target) => target.output);

  assert.equal(new Set(outputs).size, outputs.length, "duplicate vector output paths");
  assert.ok(vectorTargets.length >= 10, "expected the verified Jestei/client vector batch");
});

test("generator compensates SVG import scale before mesh conversion", async () => {
  const source = await readFile(generatorUrl, "utf8");
  assert.match(source, /depth[^\n]*\/ \(2\.0 \* scale\)/);
  const extrusionIndex = source.indexOf("curve.data.extrude");
  const convertIndex = source.indexOf('bpy.ops.object.convert(target="MESH")');
  const applyScaleIndex = source.indexOf("bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)");
  assert.ok(extrusionIndex >= 0 && convertIndex > extrusionIndex, "extrusion must happen before conversion");
  assert.ok(applyScaleIndex > convertIndex, "SVG scale must be applied after conversion");
});


test("production pack keeps Blender master local and exports portable formats", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  assert.deepEqual(manifest.localMasterFormats, ["blend"]);
  assert.deepEqual(manifest.exportFormats, ["glb", "fbx", "obj", "stl"]);

  const source = await readFile(generatorUrl, "utf8");
  assert.match(source, /save_as_mainfile/);
  assert.match(source, /_local[^\n]*logo-3d[^\n]*blend/);
  assert.match(source, /export_scene\.gltf/);
  assert.match(source, /export_scene\.fbx/);
  assert.match(source, /wm\.obj_export/);
  assert.match(source, /wm\.stl_export/);
});

test("batch generation routes reference targets through packOutput", async () => {
  const source = await readFile(generatorUrl, "utf8");
  assert.match(source, /target\.get\("packOutput", target\["output"\]\)/);
});

test("ready Jestei reference has a separate production-pack output", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const symbol = manifest.targets.find((target) => target.id === "jestei-symbol-metal");
  assert.ok(symbol?.packOutput, "Jestei symbol needs a non-reference pack path");
  assert.notEqual(symbol.packOutput, symbol.output, "production pack must not overwrite reference GLB");
});

test("Jestei material colors match current logo and product sources", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  assert.equal(manifest.materials["jestei-pear-plastic"].color, "#D1E231");
  assert.equal(manifest.materials["jestei-orange-plastic"].color, "#F18200");
  assert.equal(manifest.materials["jestei-blue-plastic"].color, "#147AFF");
  assert.equal(manifest.materials["jestei-biloba-plastic"].color, "#B19FE9");
  assert.equal(manifest.materials["jestei-secondary-orange-plastic"].color, "#FF8710");
  const symbolOrange = manifest.targets.find((target) => target.id === "jestei-symbol-orange");
  assert.equal(symbolOrange.materialId, "jestei-secondary-orange-plastic");
});

test("production pack includes preview and provenance metadata", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  assert.equal(manifest.preview?.format, "png");
  assert.equal(manifest.preview?.size, 1024);

  const source = await readFile(generatorUrl, "utf8");
  assert.match(source, /bpy\.ops\.render\.render\(write_still=True\)/);
  assert.match(source, /metadata/);
  assert.match(source, /sourceType/);
});

test("preview renderer uses the Blender 5.2 engine enum available on Titan", async () => {
  const source = await readFile(generatorUrl, "utf8");
  assert.match(source, /scene\.render\.engine = "BLENDER_EEVEE"/);
  assert.doesNotMatch(source, /BLENDER_EEVEE_NEXT/);
});

test("generated vector packs are marked ready but remain deterministically regeneratable", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const vectorTargets = manifest.targets.filter((target) => target.sourceType === "vector-svg");
  assert.ok(vectorTargets.every((target) => target.status === "ready"));

  const source = await readFile(generatorUrl, "utf8");
  assert.match(source, /status[^\n]*\{[^\n]*"planned"[^\n]*"ready"/);
  assert.match(source, /target\.get\("packOutput", target\["output"\]\)/);
});