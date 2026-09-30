import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const contextUrl = new URL("../src/features/contact-hub/context.ts", import.meta.url);

async function loadContextContract() {
  assert.equal(
    existsSync(contextUrl),
    true,
    "RED: shared Contact Hub privacy context is not implemented on current dev",
  );
  return import(contextUrl.href);
}

test("shared ContactContext exposes navigation state but strips form PII and message content", async () => {
  const { buildSharedContactContext } = await loadContextContract();

  const context = buildSharedContactContext({
    currentPath: "/work/styx/",
    language: "ru",
    entryPoint: "site-contact",
    activeMode: "form",
    name: "Sensitive Name",
    email: "private@example.com",
    message: "private message",
    filename: "private.pdf",
    phone: "+0000000000",
  });

  assert.deepEqual(context, {
    currentPath: "/work/styx/",
    language: "ru",
    entryPoint: "site-contact",
    activeMode: "form",
  });

  for (const forbidden of [
    "name",
    "email",
    "message",
    "filename",
    "phone",
    "ip",
    "fingerprint",
    "webvisorId",
  ]) {
    assert.equal(
      Object.hasOwn(context, forbidden),
      false,
      `shared context must not contain ${forbidden}`,
    );
  }
});

test("shared ContactContext rejects invalid mode, language, entry point and empty path", async () => {
  const { buildSharedContactContext } = await loadContextContract();

  const valid = {
    currentPath: "/",
    language: "ru",
    entryPoint: "pet",
    activeMode: "ai",
  };

  assert.throws(
    () => buildSharedContactContext({ ...valid, currentPath: "   " }),
    /currentPath/u,
  );
  assert.throws(
    () => buildSharedContactContext({ ...valid, language: "de" }),
    /language/u,
  );
  assert.throws(
    () => buildSharedContactContext({ ...valid, entryPoint: "unknown" }),
    /entryPoint/u,
  );
  assert.throws(
    () => buildSharedContactContext({ ...valid, activeMode: "unknown" }),
    /activeMode/u,
  );
});
