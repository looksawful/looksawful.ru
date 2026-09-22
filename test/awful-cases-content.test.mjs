import assert from "node:assert/strict";
import test from "node:test";
import { COPY, DICTIONARIES } from "../src/components/awful-cases-content.js";

function task(locale, type, input) {
  return DICTIONARIES[locale].find((item) => item.type === type && item.input === input);
}

test("Awful Cases typography examples preserve enabled real Unicode output", () => {
  assert.equal(task("en", "lint", "\"hello\"")?.output, "\u00abhello\u00bb");
  assert.equal(task("ru", "lint", "(c) test")?.output, "\u00a9 test");
  assert.equal(task("ru", "lint", "(tm) brand")?.output, "\u2122 brand");
});

test("Awful Cases Russian copy keeps the real application terminology", () => {
  assert.equal(
    COPY.ru.actionTitles.upper,
    "\u0432\u0435\u0440\u0445\u043d\u0438\u0439 \u0440\u0435\u0433\u0438\u0441\u0442\u0440",
  );
  assert.equal(
    COPY.ru.actionTitles.lint,
    "\u0442\u0438\u043f\u043e\u0433\u0440\u0430\u0444\u0441\u043a\u0438\u0439 \u043b\u0438\u043d\u0442\u0435\u0440",
  );
  assert.equal(
    COPY.ru.actionTitles.sentence,
    "\u0442\u0438\u043f\u043e\u0433\u0440\u0430\u0444\u0438\u043a\u0430 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0439",
  );
});
