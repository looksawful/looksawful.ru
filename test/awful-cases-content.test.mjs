import assert from "node:assert/strict";
import test from "node:test";
import { COPY, DICTIONARIES } from "../src/components/awful-cases-content.js";

function task(locale, type, input) {
  return DICTIONARIES[locale].find((item) => item.type === type && item.input === input);
}

test("Awful Cases typography examples preserve exact Unicode output", () => {
  assert.equal(task("en", "lint", "hello...")?.output, "hello\u2026");
  assert.equal(
    task("ru", "lint", "\u043a\u043e\u0435 - \u043a\u0442\u043e")?.output,
    "\u043a\u043e\u0435\u2011\u043a\u0442\u043e",
  );
});

test("Awful Cases Russian copy keeps the real application terminology", () => {
  assert.equal(
    COPY.ru.actionTitles.upper,
    "\u0432\u0435\u0440\u0445\u043d\u0438\u0439 \u0440\u0435\u0433\u0438\u0441\u0442\u0440",
  );
  assert.equal(
    COPY.ru.actionTitles.lint,
    "\u043e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0442\u0438\u043f\u043e\u0433\u0440\u0430\u0444\u0438\u043a\u0443",
  );
  assert.equal(
    COPY.ru.actionTitles.sentence,
    "\u0442\u0438\u043f\u043e\u0433\u0440\u0430\u0444\u0438\u043a\u0430 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0439",
  );
});
