import assert from "node:assert/strict";
import test from "node:test";

const ID = "11111111-1111-4111-8111-111111111111";
const OLD_REVISION = "a".repeat(64);
const NEW_REVISION = "b".repeat(64);

test("media editor keeps the revision captured at selection instead of refreshing it at save time", async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocation = globalThis.location;

  const documentTarget = new EventTarget();
  let diskRevision = OLD_REVISION;
  let getCount = 0;
  let postedExpectedRevision = null;

  const nativeFetch = async (input, init = {}) => {
    const url = new URL(String(input), "http://localhost");
    if (url.pathname === "/__media-desk/metadata" && (init.method ?? "GET").toUpperCase() === "GET") {
      getCount += 1;
      return Response.json({ ok: true, id: ID, revision: diskRevision });
    }
    if (url.pathname === "/__media-desk/metadata" && (init.method ?? "GET").toUpperCase() === "POST") {
      const body = JSON.parse(String(init.body));
      postedExpectedRevision = body.expectedRevision;
      if (body.expectedRevision !== diskRevision) {
        return Response.json({ ok: false, error: "Revision conflict" }, { status: 409 });
      }
      return Response.json({ ok: true, id: ID, revision: NEW_REVISION });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  try {
    globalThis.window = { fetch: nativeFetch };
    globalThis.document = documentTarget;
    globalThis.location = new URL("http://localhost/");

    const module = await import(`../src/devtools/media-desk/revision-client.ts?session=${Date.now()}`);
    module.installRevisionAwareMediaFetch();

    const selection = new Event("media-desk:selection-change");
    Object.defineProperty(selection, "detail", { value: { ids: [ID] } });
    documentTarget.dispatchEvent(selection);
    assert.equal(await module.loadMediaDeskRevision(ID), OLD_REVISION);
    assert.equal(getCount, 1, "selection must capture exactly one source revision");

    diskRevision = NEW_REVISION;
    const response = await globalThis.window.fetch("/__media-desk/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: ID, metadata: { title: "stale edit" } }),
    });

    assert.equal(response.status, 409);
    assert.equal(postedExpectedRevision, OLD_REVISION);
    assert.equal(getCount, 1, "save must not refresh the revision and bypass stale-session detection");
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalLocation === undefined) delete globalThis.location;
    else globalThis.location = originalLocation;
  }
});
