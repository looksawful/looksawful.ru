import assert from "node:assert/strict";
import test from "node:test";

import {
  REMOTE_MEDIA_TRANSPORT_LIMIT_BYTES,
  uploadNewMedia,
} from "../src/devtools/media-desk/remote-actions.ts";

function sessionSpy() {
  const calls = [];
  return {
    calls,
    session: {
      async sourceRevision() { throw new Error("unexpected revision read"); },
      async postJson() { throw new Error("unexpected JSON mutation"); },
      async postMultipart(path, metadata, file) {
        calls.push({ path, metadata, file });
        return { ok: true, branchHead: "head-b", assetId: "cms-new" };
      },
    },
  };
}
test("new remote upload creates canonical media metadata and preserves gallery choice", async () => {
  const spy = sessionSpy();
  const file = new File([new Uint8Array([1, 2, 3])], "portrait.webp", { type: "image/webp" });

  const result = await uploadNewMedia(spy.session, file, {
    title: " Portrait ",
    alt: "portrait alt",
    showInCatalog: true,
    width: 1200,
    height: 1600,
    durationSeconds: 0,
  });

  assert.equal(result.assetId, "cms-new");
  assert.equal(spy.calls.length, 1);
  assert.equal(spy.calls[0].path, "/api/media/upload");
  assert.equal(spy.calls[0].file, file);
  assert.deepEqual(spy.calls[0].metadata, {
    mediaType: "image",
    mimeType: "image/webp",
    title: "Portrait",
    alt: "portrait alt",
    description: "",
    date: "",
    width: 1200,
    height: 1600,
    durationSeconds: 0,
    showInCatalog: true,
    reusable: false,
    archived: false,
  });
});

test("remote upload rejects unsupported, empty-title and oversized files before network", async () => {
  const spy = sessionSpy();
  const unsupported = new File([new Uint8Array([1])], "notes.pdf", { type: "application/pdf" });
  await assert.rejects(
    () => uploadNewMedia(spy.session, unsupported, { title: "Notes", width: 0, height: 0 }),
    /image or video/i,
  );

  const image = new File([new Uint8Array([1])], "shot.webp", { type: "image/webp" });
  await assert.rejects(
    () => uploadNewMedia(spy.session, image, { title: "   ", width: 1, height: 1 }),
    /title/i,
  );
  const oversized = new File(
    [new Uint8Array(REMOTE_MEDIA_TRANSPORT_LIMIT_BYTES + 1)],
    "large.webp",
    { type: "image/webp" },
  );
  await assert.rejects(
    () => uploadNewMedia(spy.session, oversized, { title: "Large", width: 1, height: 1 }),
    /16 mib/i,
  );
  assert.equal(spy.calls.length, 0);
});
