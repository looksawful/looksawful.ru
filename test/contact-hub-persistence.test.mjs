import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const persistenceUrl = new URL("../src/features/contact-hub/persistence.ts", import.meta.url);

class MemoryStorage {
  values = new Map();
  lastKey = null;
  lastValue = null;

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  removeItem(key) { this.values.delete(key); }
  setItem(key, value) {
    this.lastKey = key;
    this.lastValue = String(value);
    this.values.set(key, String(value));
  }
}

async function loadPersistence() {
  assert.equal(existsSync(persistenceUrl), true, "RED: Contact Hub session persistence is not implemented yet");
  return import(persistenceUrl.href);
}

test("F-021/PRV-003: session draft survives same-tab store recreation and excludes attachment data", async () => {
  const { createSessionContactDraftStore } = await loadPersistence();
  const storage = new MemoryStorage();
  const first = createSessionContactDraftStore(storage);
  const draft = {
    name: "Иван",
    email: "person@example.com",
    message: "Строка 1\nСтрока 2",
    attachment: { name: "private.pdf", bytes: "secret" },
  };

  first.write(draft);
  const second = createSessionContactDraftStore(storage);
  assert.deepEqual(second.read(), {
    name: "Иван",
    email: "person@example.com",
    message: "Строка 1\nСтрока 2",
  });
  assert.equal(storage.lastValue.includes("attachment"), false);
  assert.equal(storage.lastValue.includes("private.pdf"), false);

  second.clear();
  assert.equal(first.read(), null);
});

test("F-021: corrupt session data fails closed instead of breaking Contact Hub", async () => {
  const { createSessionContactDraftStore } = await loadPersistence();
  const storage = new MemoryStorage();
  const store = createSessionContactDraftStore(storage);
  store.write({ name: "", email: "person@example.com", message: "draft" });
  storage.setItem(storage.lastKey, "{broken-json");
  assert.equal(store.read(), null);
});
