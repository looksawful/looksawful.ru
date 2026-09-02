import { execFileSync } from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const p = (...parts) => path.join(root, ...parts);
const read = (file) => readFileSync(p(file), 'utf8');
const write = (file, content) => {
  mkdirSync(path.dirname(p(file)), { recursive: true });
  writeFileSync(p(file), content.endsWith('\n') ? content : `${content}\n`);
};
const json = (file) => JSON.parse(read(file));
const writeJson = (file, value) => write(file, JSON.stringify(value, null, 2));
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit', ...options });
const capture = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();

run('git', ['config', 'user.name', 'github-actions[bot]']);
run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);

function commit(message) {
  run('git', ['add', '-A']);
  if (!capture('git', ['status', '--short'])) return;
  run('git', ['commit', '-m', message]);
}

function move(from, to) {
  mkdirSync(path.dirname(p(to)), { recursive: true });
  renameSync(p(from), p(to));
}

function walkFiles(dir, out = []) {
  if (!existsSync(p(dir))) return out;
  for (const entry of readdirSync(p(dir))) {
    const rel = path.posix.join(dir, entry);
    if (statSync(p(rel)).isDirectory()) walkFiles(rel, out);
    else out.push(rel);
  }
  return out;
}

function replaceAcrossRepo(replacements) {
  const files = ['src', 'tools', 'test', 'docs', '.github'].flatMap((dir) => walkFiles(dir));
  for (const file of ['.pages.yml', 'AGENTS.md', 'README.md', 'package.json']) if (existsSync(p(file))) files.push(file);
  const allowed = /\.(?:ts|js|mjs|cjs|json|md|yml|yaml|html|css)$/i;
  for (const file of [...new Set(files)]) {
    if (!allowed.test(file)) continue;
    let content;
    try { content = read(file); } catch { continue; }
    let next = content;
    for (const [from, to] of replacements) next = next.split(from).join(to);
    if (next !== content) write(file, next);
  }
}

// 01 package/dev/build separation
{
  const pkg = json('package.json');
  pkg.scripts.dev = 'vite';
  pkg.scripts.build = 'npm run build:site';
  pkg.scripts['verify:fast'] = 'npm run typecheck && npm run test:fast && npm run build:site';
  pkg.scripts['media:sync:image'] = 'npm run media:catalog:sync && npm run media:build && node tools/media-dev-state.mjs --write';
  pkg.scripts['media:sync:video'] = 'npm run media:catalog:sync && npm run media:video:build && node tools/media-dev-state.mjs --write';
  writeJson('package.json', pkg);
  commit('build: separate read-only dev and build from media mutation');
}

// 02 editorial text-only architecture
{
  const moves = [
    ['src/content/navigation.json', 'src/content/editorial/navigation.json'],
    ['src/content/cases/jestei-pool.json', 'src/content/editorial/cases/jestei-pool.json'],
    ['src/content/cases/styx.json', 'src/content/editorial/cases/styx.json'],
    ['src/content/cases/sensetique.json', 'src/content/editorial/cases/sensetique.json'],
    ['src/content/collections/shootings.json', 'src/content/editorial/collections/shootings.json'],
    ['src/content/standalone-projects/awful-cases.json', 'src/content/editorial/standalone-projects/awful-cases.json'],
    ['src/content/standalone-projects/berry-social-content-2020.json', 'src/content/editorial/standalone-projects/berry-social-content-2020.json'],
  ];
  for (const [from, to] of moves) move(from, to);

  const cards = json('src/content/projects.json');
  const copy = cards.map((card) => {
    const item = { id: card.id, focus: card.focus ?? '', coverAlt: card.cover?.alt ?? '' };
    for (const key of ['title', 'role', 'period', 'ariaLabel']) if (key in card) item[key] = card[key];
    return item;
  });
  const structure = cards.map((card) => ({
    id: card.id,
    visible: card.visible,
    cover: { src: card.cover.src, width: card.cover.width, height: card.cover.height },
  }));
  writeJson('src/content/editorial/home-project-cards.json', copy);
  writeJson('src/content/projects.json', structure);

  replaceAcrossRepo([
    ['src/content/navigation.json', 'src/content/editorial/navigation.json'],
    ['content/cases/', 'content/editorial/cases/'],
    ['content/collections/shootings.json', 'content/editorial/collections/shootings.json'],
    ['content/standalone-projects/', 'content/editorial/standalone-projects/'],
  ]);

  let projectsTs = read('src/data/projects.ts');
  const importNeedle = 'import projectsJson from "../content/projects.json" with { type: "json" };';
  if (!projectsTs.includes(importNeedle)) throw new Error('projects import not found');
  projectsTs = projectsTs.replace(importNeedle, `${importNeedle}\nimport projectCardCopyJson from "../content/editorial/home-project-cards.json" with { type: "json" };`);
  const sourceNeedle = 'const rawProjectCards: unknown = projectsJson;';
  if (!projectsTs.includes(sourceNeedle)) throw new Error('rawProjectCards source not found');
  projectsTs = projectsTs.replace(sourceNeedle, `const rawProjectCards: unknown = projectsJson.map((card) => {\n  const editorial = projectCardCopyJson.find((entry) => entry.id === card.id);\n  if (!editorial) throw new Error(\`missing project-card editorial copy: \${card.id}\`);\n  return {\n    id: card.id,\n    visible: card.visible,\n    title: "title" in editorial ? editorial.title : undefined,\n    focus: editorial.focus,\n    role: "role" in editorial ? editorial.role : undefined,\n    period: "period" in editorial ? editorial.period : undefined,\n    ariaLabel: "ariaLabel" in editorial ? editorial.ariaLabel : undefined,\n    cover: {\n      src: card.cover.src,\n      alt: editorial.coverAlt,\n      width: card.cover.width,\n      height: card.cover.height,\n    },\n  };\n});`);
  write('src/data/projects.ts', projectsTs);

  let scope = read('tools/cms-publication-scope.mjs');
  if (!scope.includes('const CMS_CONTENT_COLLECTIONS = [')) throw new Error('CMS collection marker not found');
  scope = scope.replace(
    'const CMS_CONTENT_COLLECTIONS = [',
    'const CMS_EDITORIAL_PATTERNS = [/^src\\/content\\/editorial\\/.+\\.json$/];\n\nconst CMS_CONTENT_COLLECTIONS = [',
  );
  const classifyNeedle = 'if (FIXED_CMS_CONTENT.has(file) || CMS_CONTENT_COLLECTIONS.some((pattern) => pattern.test(file))) {';
  if (!scope.includes(classifyNeedle)) throw new Error('CMS classifier marker not found');
  scope = scope.replace(classifyNeedle, `if (CMS_EDITORIAL_PATTERNS.some((pattern) => pattern.test(file))) return CMS_CONTENT;\n\n  ${classifyNeedle}`);
  write('tools/cms-publication-scope.mjs', scope);
  commit('content: isolate authored copy from structure and media');
}

// 03/04/05/06 workflows were prepared before this migration run.
commit('ci: register minimal automatic and manual workflow architecture');

// 07 Pages CMS routes text editors to editorial files and verification to manual quality.
{
  let pages = read('.pages.yml');
  pages = pages.split('workflow: verify-pr.yml').join('workflow: quality-manual.yml');
  const projectBlock = /\n  - name: project-cards\n[\s\S]*?(?=\n  - name: )/;
  if (!projectBlock.test(pages)) throw new Error('project-cards Pages CMS block not found');
  pages = pages.replace(projectBlock, `\n  - name: project-card-copy\n    label: Карточки проектов — тексты\n    type: file\n    path: src/content/editorial/home-project-cards.json\n    format: json\n    list: true\n    operations:\n      create: false\n      rename: false\n      delete: false\n    commit:\n      templates:\n        update: "content(cms): update homepage project copy"\n    actions:\n      - name: verify-project-card-copy\n        label: Проверить сайт\n        workflow: quality-manual.yml\n        ref: current\n    fields:\n      - name: id\n        label: ID\n        type: string\n        required: true\n        readonly: true\n      - name: title\n        label: Название\n        type: string\n      - name: focus\n        label: Описание\n        type: text\n      - name: role\n        label: Роль\n        type: string\n      - name: period\n        label: Период\n        type: string\n      - name: ariaLabel\n        label: ARIA label\n        type: string\n      - name: coverAlt\n        label: Alt обложки\n        type: text\n\n  - name: project-card-structure\n    label: Карточки проектов — структура и обложки\n    type: file\n    path: src/content/projects.json\n    format: json\n    list: true\n    operations:\n      create: false\n      rename: false\n      delete: false\n    commit:\n      templates:\n        update: "content(cms): update homepage project structure"\n    fields:\n      - name: id\n        label: ID\n        type: string\n        required: true\n        readonly: true\n      - name: visible\n        label: Показывать на главной\n        type: boolean\n        required: true\n      - name: cover\n        label: Обложка\n        type: object\n        required: true\n        fields:\n          - name: src\n            label: Обложка проекта\n            type: image\n            required: true\n            options:\n              media: project-covers\n              extensions: [webp]\n              categories: [image]\n              rename: safe\n          - name: width\n            label: Ширина\n            type: number\n            required: true\n            options:\n              min: 1\n          - name: height\n            label: Высота\n            type: number\n            required: true\n            options:\n              min: 1\n`);
  write('.pages.yml', pages);

  let publish = read('.github/workflows/pages-cms-publish.yml');
  publish = publish.replace('Publish verified CMS changes', 'Publish CMS changes');
  publish = publish.replace('Do not merge until required verification checks are green.', 'Review the diff before merging. Optional quality checks are available separately.');
  write('.github/workflows/pages-cms-publish.yml', publish);
  commit('cms: separate text save from structural and publication operations');
}

// 08 delete historical automatic/scheduled workflows.
for (const file of [
  'verify-pr.yml', 'verify-dev.yml', 'verify-full.yml', 'verify-cv-branch.yml',
  'dependency-audit.yml', 'external-links.yml', 'healthcheck.yml', 'lighthouse.yml', 'codeql.yml',
  'sync-cms-media-metadata.yml',
]) {
  const target = p('.github/workflows', file);
  if (existsSync(target)) rmSync(target);
}
commit('ci: remove legacy automatic and scheduled workflows');

// 09 rewrite legacy CI contracts/docs instead of preserving tests of deleted YAML.
{
  for (const file of ['test/ci-pipeline.test.mjs', 'test/media-ci-cache.test.mjs']) if (existsSync(p(file))) rmSync(p(file));

  let runtime = read('test/cms-runtime-editability.test.mjs');
  runtime = runtime.replace(/const workflowUrls = \[[\s\S]*?\];\n\n/, '');
  runtime = runtime.replace(/\ntest\("generated-media cache stores[\s\S]*?\n\}\);\n?$/, '\n');
  write('test/cms-runtime-editability.test.mjs', runtime);

  let runner = read('tools/ci/run-tests.mjs');
  runner = runner.replace(
    'ci-pipeline|change-scope|e2e-concurrency|media-ci-cache|tooling-pipeline|e2e-production-pipeline|test-groups',
    'ci-minimal-pipeline|change-scope|e2e-concurrency|tooling-pipeline|e2e-production-pipeline|test-groups',
  );
  write('tools/ci/run-tests.mjs', runner);

  write('docs/ci-pipeline-report.md', '# CI pipeline\n\n| Change | Automatic operation |\n| --- | --- |\n| `src/content/editorial/**` | none |\n| Engineering push to `dev` | Fast CI: install, typecheck, fast tests, build |\n| Media source / project cover mutation | CMS media, then Fast CI for the final normalized source-upload SHA |\n| Push to `prod` | exact production build, Pages deploy, HTTP/SHA/assets verification |\n\nPlaywright, full E2E, Lighthouse, dependency audit, external links, production health, full media regression and CodeQL are manual tools.\n');
  write('docs/tooling-pipeline.md', '# Tooling pipeline\n\n- `npm run dev` starts Vite only.\n- `npm run build` is a read-only site build and never prepares media.\n- `npm run verify:fast` is the default engineering verification.\n- `npm run media:sync` is an explicit media mutation command.\n- `.github/workflows/quality-manual.yml` contains optional heavy quality suites.\n- `.github/workflows/codeql-manual.yml` contains optional CodeQL analysis.\n- Pages CMS authored copy lives under `src/content/editorial/**`; saving those files triggers no GitHub Actions.\n');

  replaceAcrossRepo([
    ['verify-pr.yml', 'quality-manual.yml'],
    ['verify-dev.yml', 'ci-fast.yml'],
    ['verify-full.yml', 'quality-manual.yml'],
    ['verify-cv-branch.yml', 'quality-manual.yml'],
    ['sync-cms-media-metadata.yml', 'cms-media.yml'],
  ]);
  commit('test: update architecture contracts and operations documentation');
}

// 10 global instructions become short operational invariants.
write('AGENTS.md', '# Agent Instructions\n\n- Keep changes scoped to the current task. Do not perform unrelated UI, content or runtime refactors.\n- Do not modify authored/user-facing copy unless content changes are explicitly part of the task.\n- Explain frontend intent and tradeoffs in Russian when changing HTML, CSS, JavaScript or TypeScript.\n- Do not hand-edit generated media outputs. Change the source/master or generator and regenerate deterministically.\n- Never create placeholder production media only to satisfy checks.\n- Preserve retained media source masters during optimization.\n- `npm run dev` and ordinary builds must remain non-mutating.\n- For ordinary engineering changes, `npm run verify:fast` is the default local verification.\n- Run media checks only for media-related changes.\n- Browser, Lighthouse, security and exhaustive regression checks are optional unless the task specifically requires them.\n- Do not use destructive Git operations that may discard user work, including `git reset --hard`, destructive `git clean`, forced checkout or force-push without explicit approval.\n- Normal merge/rebase operations are allowed when the worktree is clean and they do not discard work.\n- If a requested check cannot be run, report exactly which check was not run.\n');
commit('docs: reduce global agent rules to operational invariants');

// Verification: no browser suite is required for workflow-only architecture work.
run('npm', ['ci']);
run('npm', ['run', 'typecheck']);
run('npm', ['run', 'test:fast']);
run('npm', ['run', 'build:site']);
run(process.execPath, ['--test']);
run('git', ['diff', '--check', 'origin/dev...HEAD']);

const beforeBuild = capture('git', ['status', '--short']);
run('npm', ['run', 'build']);
const afterBuild = capture('git', ['status', '--short']);
if (beforeBuild !== afterBuild) throw new Error(`npm run build mutated repository\nBEFORE:\n${beforeBuild}\nAFTER:\n${afterBuild}`);

for (const file of walkFiles('.github/workflows').filter((file) => /\.ya?ml$/.test(file))) {
  const content = read(file);
  if (/^\s*schedule:/m.test(content) || /^\s*cron:/m.test(content)) throw new Error(`scheduled trigger remains in ${file}`);
}

for (const file of ['.github/workflows/_migration-red.yml', 'tools/_apply-minimal-ci.mjs']) {
  if (existsSync(p(file))) rmSync(p(file));
}
commit('chore: remove one-time CI migration runner');

if (capture('git', ['status', '--short'])) throw new Error('working tree is not clean before push');
run('git', ['push', 'origin', `HEAD:${process.env.GITHUB_REF_NAME}`]);
console.log(`Migration complete at ${capture('git', ['rev-parse', 'HEAD'])}`);
