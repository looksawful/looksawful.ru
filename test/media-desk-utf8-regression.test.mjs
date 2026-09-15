import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inventory = await readFile(
  new URL("../src/devtools/media-desk/inventory-readonly.ts", import.meta.url),
  "utf8",
);
const worker = await readFile(
  new URL("../tools/cloudflare/media-desk/worker.mjs", import.meta.url),
  "utf8",
);

test("Media Desk source keeps intentional UTF-8 UI copy", () => {
  for (const text of [
    "Показать",
    "Поиск по inventory metadata",
    "Фильтр использования",
    "Все usage",
    "Используется",
    "Совпадений нет",
    " · ",
    "—",
    "×",
  ]) assert.match(inventory, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const text of [
    "Media Desk · looksawful",
    "Закрытая рабочая область looksawful.",
    "Пароль",
    "Войти",
    "Введите пароль.",
    "Неверный пароль.",
  ]) assert.match(worker, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

const remoteControls = await readFile(
  new URL("../src/devtools/media-desk/inventory-remote-controls.ts", import.meta.url),
  "utf8",
);

test("remote controls do not retain replacement placeholder copy", () => {
  assert.doesNotMatch(remoteControls, /\?{4}/);
  for (const text of [
    "\u041d\u0430\u0437\u043d\u0430\u0447\u0430\u044e \u043e\u0431\u043b\u043e\u0436\u043a\u0443 \u043f\u0440\u043e\u0435\u043a\u0442\u0430\u2026",
    "\u041e\u0431\u043b\u043e\u0436\u043a\u0430 \u043f\u0440\u043e\u0435\u043a\u0442\u0430 \u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d\u0430:",
    "\u041d\u0430\u0437\u043d\u0430\u0447\u0430\u044e \u043e\u0431\u043b\u043e\u0436\u043a\u0443 pet\u2026",
    "\u041e\u0431\u043b\u043e\u0436\u043a\u0430 pet \u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d\u0430:",
  ]) assert.ok(remoteControls.includes(text));
});
