import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const registeredRecordsPath = "src/content/media-catalog/registered";

async function readRegisteredRecords() {
  const filenames = (await readdir(registeredRecordsPath))
    .filter((filename) => filename.endsWith(".json"))
    .sort();
  const records = await Promise.all(
    filenames.map(async (filename) => ({
      filename,
      value: JSON.parse(await readFile(`${registeredRecordsPath}/${filename}`, "utf8")),
    })),
  );
  return records;
}

function ids(values) {
  return values.map((value) => value.id);
}

test("media catalog taxonomy reuses canonical IDs and contains every requested category", async () => {
  const {
    mediaCatalogDeliverables,
    mediaCatalogProjectTypes,
    mediaCatalogShootingTypes,
    mediaCatalogWorkAreas,
  } = await import("../src/data/taxonomy/media-taxonomy.ts");

  for (const id of [
    "photography",
    "production",
    "illustration",
    "graphic-design",
    "identity",
    "motion",
    "3d",
  ]) {
    assert.ok(ids(mediaCatalogWorkAreas).includes(id), `missing requested work area ${id}`);
  }

  for (const id of [
    "music-shooting",
    "lookbook",
    "catalog",
    "campaign-shooting",
    "editorial",
  ]) {
    assert.ok(ids(mediaCatalogShootingTypes).includes(id), `missing requested shooting type ${id}`);
    assert.ok(ids(mediaCatalogProjectTypes).includes(id), `shooting type ${id} must be canonical`);
  }

  for (const id of [
    "brandbook",
    "logo",
    "business-card",
    "advertising-banner",
    "social-post",
    "advertising-creative",
    "cover",
    "certificate",
    "poster",
    "sticker",
    "booklet",
    "t-shirt",
    "packaging",
    "screen-mockup",
    "music-cover",
    "book",
  ]) {
    assert.ok(ids(mediaCatalogDeliverables).includes(id), `missing requested deliverable ${id}`);
  }
});

test("every registered MediaAsset has exactly one editable catalog record", async () => {
  const { registeredMediaAssets } = await import("../src/data/media/assets/registered.ts");
  const records = await readRegisteredRecords();

  assert.equal(records.length, registeredMediaAssets.length);
  assert.deepEqual(
    records.map(({ filename }) => filename),
    registeredMediaAssets.map(({ id }) => `${id}.json`).sort(),
  );

  const seen = new Set();
  for (const { filename, value } of records) {
    assert.equal(filename, `${value.id}.json`);
    assert.equal(seen.has(value.id), false, `duplicate media catalog ID ${value.id}`);
    seen.add(value.id);
    assert.ok(
      value.workAreaIds.length + value.projectTypeIds.length + value.deliverableIds.length > 0,
      `${value.id} must have a semantic classification`,
    );
  }
});

test("existing media receives semantic first-pass classifications", async () => {
  const { getMediaCatalogItem } = await import("../src/data/media/catalog.ts");

  const musicPortrait = getMediaCatalogItem("obladaet-01-source-02-2x3");
  assert.ok(musicPortrait.workAreaIds.includes("photography"));
  assert.ok(musicPortrait.projectTypeIds.includes("music-shooting"));

  const sensetiqueCampaign = getMediaCatalogItem("sensetique-04-source-03-3x2");
  assert.ok(sensetiqueCampaign.workAreaIds.includes("production"));
  assert.ok(sensetiqueCampaign.projectTypeIds.includes("campaign-shooting"));

  const styxScanography = getMediaCatalogItem("styx-02-source-03-1x1");
  assert.ok(styxScanography.projectTypeIds.includes("scanography-project"));

  const jesteiScreen = getMediaCatalogItem("jestei-02-source-01-16x10");
  assert.ok(jesteiScreen.deliverableIds.includes("screen-mockup"));

  const motionVideo = getMediaCatalogItem("jestei-13-source-01-16x9");
  assert.equal(motionVideo.asset.type, "video");
  assert.ok(motionVideo.workAreaIds.includes("motion"));
});

test("catalog parsers reject unknown fields and taxonomy IDs", async () => {
  const {
    parseRegisteredMediaCatalogRecord,
    parseUploadedMediaCatalogRecord,
  } = await import("../src/data/media/catalog.ts");
  const { registeredMediaAssets } = await import("../src/data/media/assets/registered.ts");
  const [stored] = await readRegisteredRecords();

  const parsed = parseRegisteredMediaCatalogRecord(stored.value, registeredMediaAssets);
  assert.equal(parsed.id, stored.value.id);

  const architectureLeak = structuredClone(stored.value);
  architectureLeak.layout = "masonry";
  assert.throws(
    () => parseRegisteredMediaCatalogRecord(architectureLeak, registeredMediaAssets),
    /unexpected|field|key/i,
  );

  const unknownTaxonomy = structuredClone(stored.value);
  unknownTaxonomy.workAreaIds = ["invented-area"];
  assert.throws(
    () => parseRegisteredMediaCatalogRecord(unknownTaxonomy, registeredMediaAssets),
    /workAreaIds|unknown/i,
  );

  const upload = {
    id: "74f88a53-7663-4eb4-a1cb-d300f219d8ab",
    mediaType: "video",
    src: "/media/catalog/sample.mov",
    deliverySrc: "/media/generated/video/catalog/sample.web.mp4",
    posterSrc: "/media/catalog/sample-poster.webp",
    width: 1920,
    height: 1080,
    durationSeconds: 12.5,
    mimeType: "video/quicktime",
    byteLength: 1024,
    title: "Sample video",
    alt: "",
    description: "",
    date: "2026",
    projectIds: [],
    workAreaIds: ["production", "motion"],
    projectTypeIds: ["video-project"],
    deliverableIds: [],
    tags: ["showreel"],
    credits: [],
    reusable: true,
    archived: false,
  };

  const parsedUpload = parseUploadedMediaCatalogRecord(upload);
  assert.deepEqual(parsedUpload.asset, {
    id: `cms-${upload.id}`,
    type: "video",
    src: upload.deliverySrc,
    sourceSrc: upload.src,
    width: upload.width,
    height: upload.height,
  });
});

test("media catalog query API intersects facets and matches normalized tags", async () => {
  const { findMediaCatalogItems, mediaCatalogItems, mediaAssets } =
    await import("../src/data/media/index.ts");

  assert.equal(mediaCatalogItems.length, mediaAssets.length);
  assert.deepEqual(
    new Set(mediaCatalogItems.map(({ asset }) => asset.id)),
    new Set(mediaAssets.map(({ id }) => id)),
  );

  const productionCampaigns = findMediaCatalogItems({
    workAreaIds: ["production"],
    projectTypeIds: ["campaign-shooting"],
    archived: false,
  });
  assert.ok(productionCampaigns.length > 0);
  assert.ok(productionCampaigns.every((item) => item.workAreaIds.includes("production")));
  assert.ok(productionCampaigns.every((item) => item.projectTypeIds.includes("campaign-shooting")));

  const tagged = mediaCatalogItems.find((item) => item.tags.length > 0);
  assert.ok(tagged, "at least one seeded catalog record must have a tag");
  assert.ok(findMediaCatalogItems({ tags: [tagged.tags[0].toLocaleUpperCase("ru-RU")] }).includes(tagged));
});

test("Pages CMS exposes registered media metadata and createable photo/video uploads", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");

  assert.match(cms, /name: media-catalog\b/);
  assert.match(cms, /input: public\/media\/catalog/);
  assert.match(cms, /output: \/media\/catalog/);
  assert.match(cms, /categories: \[image, video\]/);

  const start = cms.indexOf("  - name: media-library\n");
  assert.notEqual(start, -1, "Media library CMS group must exist");
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n  - name: ", 4);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  assert.match(config, /name: registered-media-catalog/);
  assert.match(config, /path: src\/content\/media-catalog\/registered/);
  assert.match(config, /create: false/);
  assert.match(config, /name: uploaded-media-catalog/);
  assert.match(config, /path: src\/content\/media-catalog\/uploads/);
  assert.match(config, /create: true/);
  assert.match(config, /type: uuid/);
  assert.match(config, /type: file/);
  assert.match(config, /media: media-catalog/);
  assert.match(cms, /multiple: true/);

  for (const field of [
    "id",
    "mediaType",
    "src",
    "title",
    "alt",
    "description",
    "date",
    "projectIds",
    "workAreaIds",
    "projectTypeIds",
    "deliverableIds",
    "tags",
    "credits",
    "reusable",
    "archived",
  ]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of [
    "route",
    "canonical",
    "href",
    "renderer",
    "className",
    "layout",
    "captionView",
    "lightbox",
  ]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }

  for (const taxonomyId of [
    "photography",
    "production",
    "music-shooting",
    "lookbook",
    "catalog",
    "campaign-shooting",
    "editorial",
    "screen-mockup",
    "music-cover",
  ]) {
    assert.match(cms, new RegExp(`name: ${taxonomyId}\\b`));
  }
});
