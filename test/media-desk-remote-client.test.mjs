import assert from "node:assert/strict";
import test from "node:test";

import { RemoteMediaDeskSession } from "../src/devtools/media-desk/remote-client.ts";

test("remote session advances head only after successful mutations", async () => {
  const calls = [];
  const fetcher = async (input, init = {}) => {
    const url = new URL(String(input), "https://media.looksawful.ru");
    calls.push({ path: url.pathname, init });
    if (url.pathname === "/api/status") {
      return Response.json({ ok: true, branch: "content/text-cms", head: "head-a" });
    }
    if (url.pathname === "/api/media/revision") {
      return Response.json({ ok: true, path: "src/content/projects.json", revision: "r".repeat(64), head: "head-a" });
    }
    if (url.pathname === "/api/media/delete") {
      const body = JSON.parse(String(init.body));
      assert.equal(body.expectedHead, "head-a");
      return Response.json({ ok: true, branchHead: "head-b", commitSha: "head-b" });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  const session = new RemoteMediaDeskSession(fetcher);
  assert.equal(await session.initialize(), "head-a");
  const source = await session.sourceRevision("src/content/projects.json");
  assert.equal(source.head, "head-a");
  assert.equal(source.revision, "r".repeat(64));
  await session.postJson("/api/media/delete", { expectedRevision: source.revision, record: { id: "a" } });
  assert.equal(session.expectedHead(), "head-b");
  assert.equal(calls.length, 3);
});

test("remote session preserves the captured head when a mutation conflicts", async () => {
  const fetcher = async (input, init = {}) => {
    const url = new URL(String(input), "https://media.looksawful.ru");
    if (url.pathname === "/api/status") return Response.json({ ok: true, branch: "content/text-cms", head: "head-a" });
    if (url.pathname === "/api/media/assign") {
      const body = JSON.parse(String(init.body));
      assert.equal(body.expectedHead, "head-a");
      return Response.json({ ok: false, error: "Stale branch head" }, { status: 409 });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  const session = new RemoteMediaDeskSession(fetcher);
  await session.initialize();
  await assert.rejects(
    () => session.postJson("/api/media/assign", { target: { kind: "project-cover", ownerId: "jestei-pool" } }),
    (error) => error?.status === 409 && /stale branch head/i.test(error.message),
  );
  assert.equal(session.expectedHead(), "head-a");
});

test("remote multipart mutation carries captured head and advances only after success", async () => {
  const fetcher = async (input, init = {}) => {
    const url = new URL(String(input), "https://media.looksawful.ru");
    if (url.pathname === "/api/status") return Response.json({ ok: true, branch: "content/text-cms", head: "head-a" });
    if (url.pathname === "/api/media/replace") {
      assert.ok(init.body instanceof FormData);
      const metadata = JSON.parse(String(init.body.get("metadata")));
      assert.equal(metadata.expectedHead, "head-a");
      assert.equal(metadata.expectedRevision, "rev-a");
      const file = init.body.get("file");
      assert.equal(file.name, "next.webp");
      return Response.json({ ok: true, branchHead: "head-b", commitSha: "head-b" });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  const session = new RemoteMediaDeskSession(fetcher);
  await session.initialize();
  const file = new File([new Uint8Array([1, 2, 3])], "next.webp", { type: "image/webp" });
  await session.postMultipart("/api/media/replace", { expectedRevision: "rev-a", asset: { id: "a" } }, file);
  assert.equal(session.expectedHead(), "head-b");
});
