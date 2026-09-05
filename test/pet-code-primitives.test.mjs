import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = [
  ["Awful Cases", "public/pets/awful-cases/index.html"],
  ["Berserk Timer", "public/pets/berserk-timer/index.html"],
];

const awfulInstall = "git clone https://github.com/looksawful/awful-cases.git\ncd awful-cases";
const awfulRun = ".\\awful-cases.exe\n# AutoHotkey v2 is required only when running the source file directly.\n.\\awful-cases.ahk";
const berserkInstall = "git clone https://github.com/looksawful/berserk-timer\ncd berserk-timer\npip install -r requirements.txt";
const berserkUsage = "# start a 10 minute timer\npython -m src.main 10\n\n# start a 1.5 minute timer\npython -m src.main 1.5\n\n# start the small preset\npython -m src.main -s\n\n# start silently\npython -m src.main 25 --mute";

test("standalone pet code surfaces use one shared progressive Copy enhancer", async () => {
  for (const [label, path] of pages) {
    const html = await readFile(path, "utf8");
    assert.match(
      html,
      /<script type="module" src="\/pets\/shared-code-copy\.js"><\/script>/,
      `${label} must load the shared Copy enhancer`,
    );
    assert.doesNotMatch(
      html,
      /navigator\.clipboard\.writeText|querySelectorAll\(['"]\[data-copy-target\]/,
      `${label} must not keep a page-local Copy implementation`,
    );
    assert.match(html, /data-copy-target=/, `${label} must retain progressive Copy controls`);
  }
});

test("standalone pet commands have one authored source instead of literal HTML copies", async () => {
  const awfulHtml = await readFile("public/pets/awful-cases/index.html", "utf8");
  assert.doesNotMatch(awfulHtml, /git clone https:\/\/github\.com\/looksawful\/awful-cases\.git/);
  assert.match(awfulHtml, /<code id="install-code" data-pet-code-source="awful-cases:install"><\/code>/);
  assert.match(awfulHtml, /<code id="run-code" data-pet-code-source="awful-cases:run"><\/code>/);

  const berserkHtml = await readFile("public/pets/berserk-timer/index.html", "utf8");
  assert.doesNotMatch(berserkHtml, /git clone https:\/\/github\.com\/looksawful\/berserk-timer/);
  assert.match(berserkHtml, /<code id="install-code" data-pet-code-source="berserk-timer:install"><\/code>/);
  assert.match(berserkHtml, /<code id="usage-code" data-pet-code-source="berserk-timer:usage"><\/code>/);

  const awfulSource = JSON.parse(await readFile("src/content/standalone-projects/awful-cases-pet-code.json", "utf8"));
  assert.deepEqual(awfulSource, { install: awfulInstall, run: awfulRun });

  const berserkSource = JSON.parse(await readFile("src/content/standalone-projects/berserk-timer-code.json", "utf8"));
  assert.deepEqual(berserkSource, { install: berserkInstall, usage: berserkUsage });
});
