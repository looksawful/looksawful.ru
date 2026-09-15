import assert from "node:assert/strict";
import test from "node:test";

import { getPageByPath } from "../src/site/pages/manifest.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";

function renderBerserkPage() {
  const page = getPageByPath("/work/berserk-timer/");
  assert.ok(page && page.type === "project");
  return renderStandaloneEntityPage(page);
}

test("Berserk Timer renders its canonical project intro visibly before the specialized showcase", () => {
  const html = renderBerserkPage();

  assert.match(html, /class="project__head"/);
  assert.match(html, /class="project__intro\b/);
  assert.match(html, /<h1\b[^>]*class="project__title"[^>]*>\s*Berserk Timer\s*<\/h1>/);
  assert.match(html, /Разработчик/);
  assert.match(html, /Консольный помодоро-таймер для Windows\./);
  assert.match(html, /Python CLI-таймер с гибким вводом длительности/);
  assert.match(html, /href="https:\/\/github\.com\/looksawful\/berserk-timer"/);
  assert.doesNotMatch(html, /<h1[^>]*class="visually-hidden"[^>]*>Berserk Timer<\/h1>/);
  assert.match(html, /class="media terminal"/);
  assert.match(html, /CLI-таймер с режимом свидетеля и гибкой настройкой длительности\./);
});

test("Berserk Timer restores terminal deck, interactive audio, code blocks and project links", () => {
  const html = renderBerserkPage();

  for (const label of [
    "Запуск.",
    "Режим свидетеля.",
    "Настройки звука.",
    "Помощь.",
    "Звуковые сигналы.",
    "логи",
  ]) {
    assert.match(html, new RegExp(label.replace(".", "\\.")));
  }

  assert.match(html, /data-media-deck/);
  assert.match(html, /data-berserk-audio-player/);
  assert.match(html, /data-audio-sound="alert1\.wav"/);
  assert.match(html, /data-audio-sound="alert4\.wav"/);
  assert.match(html, /data-code-copy-button/);
  assert.match(html, /git clone https:\/\/github\.com\/looksawful\/berserk-timer/);
  assert.match(html, /python -m src\.main 25 --mute/);
  assert.match(html, /Скачать исходники/);
  assert.match(html, /Релиз v0\.2\.1-beta/);
  assert.match(html, />looksawful \/ berserk-timer<\/a>/);
});

test("Berserk Timer does not leak deck implementation labels or generic caption numbering", () => {
  const html = renderBerserkPage();

  assert.match(html, /data-deck-toggle-grid/);
  assert.match(html, /aria-label="Сетка"/);
  assert.doesNotMatch(html, />grid<\/button>/);
  assert.match(html, /data-media-caption-numbering="off"/);
});
