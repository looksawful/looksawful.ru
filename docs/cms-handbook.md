# CMS handbook

Pages CMS используется для обычного редакторского контента и разрешённых metadata. Маршруты, ID, layout, runtime и инженерный код через него менять не нужно.

## Рабочие ветви

Роли ветвей разделены:

- `content/<purpose>` — временная authoring-ветвь для одного связного редакторского batch;
- `dev` — integration/source branch для проверенного контента и engineering changes;
- `prod` — release/deployment branch и trusted source publication policy.

Обычная ручная работа в Pages CMS и локальном Content/Media Desk выполняется не напрямую в движущемся `dev`, а в `content/<purpose>` branch/worktree, созданном от свежего `origin/dev`.

Перед началом batch:

```text
git fetch origin dev
git switch -c content/<purpose> origin/dev
npm run cms:authoring:status
```

Если используется отдельный worktree, Pages CMS и локальный Desk должны указывать на один и тот же authoring worktree/branch. Перед первой записью оператор должен проверить фактическую ветвь, а не полагаться на имя папки или старую CMS-сессию.

## Authoring status

`npm run cms:authoring:status` показывает:

- текущую ветвь;
- HEAD/base SHA;
- текущий `origin/dev` SHA;
- stale/dirty state;
- changed files и их CMS publication classification;
- intended integration target (`dev`).

`npm run cms:authoring:check` дополнительно завершится ошибкой, если branch нельзя безопасно считать готовым к content-only integration: это не `content/*`, base устарел относительно `origin/dev`, worktree dirty или diff содержит `ENGINEERING` / `UNKNOWN`.

Этот helper ничего не ребейзит, не коммитит, не мержит и не публикует.

## Save

`Save` создаёт реальный Git commit в выбранной CMS branch. Для ручного authoring выбирается текущая batch-ветвь `content/<purpose>`.

Сохранение в `content/*` не является integration в `dev` и тем более production deployment.

Делай небольшие связные commits. Не держи разные редакторские задачи в одной долгоживущей ветви.

## Что можно менять

Можно менять поля, которые CMS показывает как editorial content или разрешённые metadata: тексты, подписи, описания, credits, теги, taxonomy relations, разрешённые media fields и существующие visibility controls.

Нельзя менять через обычную CMS-работу:

- routes, slugs и canonical URLs;
- стабильные IDs и project/client identity;
- layout, CSS и структуру компонентов;
- runtime, TypeScript/JavaScript и build/deploy code;
- engineering configuration и publication policy.

## Пустые поля

Если редакторское поле optional, его можно полностью очистить. Пустое значение сохраняется как отсутствие текста.

Не используй пробел (`" "`) или другой placeholder, чтобы «спрятать» текст. Structural fields — IDs, routes, taxonomy IDs, media paths и другие обязательные связи — остаются строгими и не являются optional copy.

## Показывать

Переключатель `Показывать` работает только у сущностей, для которых такой control уже предусмотрен текущей моделью. Выключенное значение скрывает соответствующую сущность через существующий runtime contract.

Если у сущности нет `Показывать`, это не означает, что visibility можно добавить произвольно через CMS.

## Media

Существующие reusable media metadata редактируются в Media Catalog. Новые CMS uploads сохраняются как source masters в `public/media/catalog/*`, а их records — в `src/content/media-catalog/uploads/*.json`.

Технические свойства — размеры, MIME, byte length, duration и generated delivery metadata — заполняет tooling. Они не становятся editorial fields. Source master сохраняется.

Лимиты и детали загрузки описаны отдельно в `docs/media-upload-policy.md`.

## Проверить authoring batch

Перед integration обнови знание о `origin/dev` и проверь batch:

```text
git fetch origin dev
npm run cms:authoring:status
npm run cms:authoring:check
```

Если `dev` ушёл вперёд, не выполняй скрытый force/rebase под открытой CMS-сессией. Сначала сохрани связный batch, закрой/останови запись, затем перенеси только intended authored commits/changes на свежий `origin/dev` через обычный reviewable integration flow и снова проверь результат.

Текущая Pages CMS action `Проверить сайт` всё ещё dispatches Fast CI на explicit `ref: dev`. Поэтому она проверяет уже интегрированный `dev`, а не произвольную `content/*` authoring branch. Проверку authoring branch даёт обычный PR/Fast CI при `content/* -> dev` integration; не считай кнопку доказательством состояния ещё не интегрированной ветви.

## Integration в dev

Готовый batch интегрируется только в `dev` через reviewable content-only PR/controlled integration.

Перед integration должны быть одновременно истинны:

- ветвь имеет форму `content/<purpose>`;
- base соответствует свежему `origin/dev`;
- worktree чистый;
- полный branch diff состоит только из разрешённых CMS content/media/generated paths;
- relevant checks зелёные.

`ENGINEERING`, `UNKNOWN` или mixed diff не является content-only batch и идёт через normal engineering flow.

После успешной integration authoring branch считается одноразовой: следующий batch начинается с новой ветви от свежего `origin/dev`. Не превращай `content/*` в третий permanent branch.

## Подготовить публикацию

`Подготовить публикацию` запускает trusted publication workflow из `prod` только после того, как intended content уже интегрирован в `dev`.

Он должен:

1. использовать интегрированный `dev` как CMS publication source, а trusted policy — из `prod`;
2. проверить допустимость текущего состояния и полного `dev -> prod` diff;
3. пропустить только разрешённый CMS-only scope;
4. создать или переиспользовать pull request `dev -> prod`.

`content/*` никогда не является прямым publication source для `prod`.

Подготовка публикации не должна merge PR и не должна автоматически deploy production. Merge и production deployment остаются отдельным release-действием.

## Docs и AGENTS.md

Даже если Pages CMS позволяет открыть или изменить documentation/agent files, `docs/**` и `AGENTS.md` являются engineering changes.

Они не должны проходить content-only authoring/integration или CMS-only publication allowlist как обычный content-only release. Такие изменения публикуются через normal engineering flow.
