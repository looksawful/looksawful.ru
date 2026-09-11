# CMS handbook

Status: CURRENT Pages CMS operator handbook. Project branch policy, executable authoring safeguards and release boundaries are separated explicitly.

Pages CMS используется для обычного редакторского контента и разрешённых metadata. Маршруты, ID, layout, runtime и инженерный код через него менять не нужно.

## Рабочая ветвь

Текущий проектный контракт:

- `dev` — GitHub default branch и working/integration branch;
- `prod` — production/release/deploy branch;
- `content/text-cms` — постоянная редакторская ветвь для Pages CMS/контентных циклов.

Новые редакторские изменения не нужно сохранять напрямую в `dev` или `prod`. Перед новым циклом `content/text-cms` должна быть безопасно сверена с текущим `dev` без force-reset и без скрытого rebase открытой редакторской сессии.

Изменения остаются в `content/text-cms`, пока пользователь явно не подтвердит `готово`. После этого batch сверяется с fresh `dev`, проходит content-only validation и интегрируется в `dev`. Production publication остаётся отдельным `dev -> prod` release.

`tools/cms-authoring-topology.mjs` является read-only guard/provenance helper для этого процесса. Он проверяет branch/worktree/HEAD, dirty state, drift относительно `dev`, explicit READY и publication scope. Он не reset/rebase/merge/commit/push.

Пример проверки кандидата после `готово`:

```bash
node tools/cms-authoring-topology.mjs --ready --files-json '["src/content/cases/styx.json"]'
```

Если `content/text-cms` и fresh `dev` разошлись в обе стороны, helper возвращает `reconciliation-required`; это сигнал для контролируемого сведения истории, а не разрешение на force-reset.

## Save

`Save` создаёт реальный Git commit в выбранной CMS branch.

Для нового редакторского цикла выбранной ветвью должна быть `content/text-cms`. Сохранение в `content/text-cms` не является интеграцией в `dev`, production deployment или разрешением на публикацию.

Не переключай CMS на `prod` для обычной редакторской работы. Не используй direct `dev` save как обход постоянной editorial branch.

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

## Local Content / Media Desk

Local Desk — отдельный developer/operator tool, а не второе имя Pages CMS.

Обычный запуск:

```bash
npm run desk
```

работает в `READ ONLY` режиме, не запускает `media:ensure`, не активирует write endpoints и фиксирует Vite host на `127.0.0.1`.

Явный локальный write-mode:

```bash
npm run desk:write
```

разрешён только на branch `content/text-cms`, вне CI/GitHub Actions и без переопределения loopback host. `dev`, `prod`, feature/fix branches и remote host override блокируются до запуска write-capable Desk.

В интерфейсе Desk отображаются `READ ONLY`/`WRITE`, current branch, HEAD, dirty state и divergence относительно `dev`.

Write API использует revision-aware optimistic concurrency: mutation требует `expectedRevision`; stale source возвращает `409`; validated single-file writes используют staged replacement; bulk writes prevalidate все candidates и имеют проверенный rollback на mid-bulk failure.

Полный локальный HTTP/write contract описан в `docs/content-media-desk-api.md`.

## Private Lab

Private Lab — отдельная non-production read-only поверхность. Она не является CMS branch, source of truth или способом обойти Desk write policy.

Lab build содержит exact branch/commit/build provenance, `noindex/nofollow/noarchive` и fail-closed middleware: без configured `LAB_PASSWORD` запрос получает `503`, а неверные credentials — `401`.

Даже успешная network authentication не даёт право на CMS/media mutation. Write authority по-прежнему определяется локальным `content/text-cms` contract.

## Проверить сайт

Текущие `Проверить сайт` actions проверяют `dev`; они не публикуют production.

Для изменений, которые ещё находятся только в `content/text-cms`, используй branch/topology verification до интеграции. Не считать проверку `dev` доказательством непроинтегрированного editorial batch.

После интеграции в `dev` существующий verification flow используется как integration gate перед release.

## Интеграция редакторского batch

До явного `готово` изменения остаются в `content/text-cms`.

После `готово`:

1. получить fresh `dev` и проверить drift `content/text-cms` через topology guard;
2. не выполнять force-reset и не прятать конфликт автоматическим rebase;
3. убедиться, что batch содержит только ожидаемые editorial/media изменения;
4. выполнить content/media validation checks;
5. интегрировать batch в `dev` через контролируемый review/merge flow;
6. проверить resulting `dev` на exact SHA;
7. только после этого рассматривать отдельный `dev -> prod` release.

## Подготовить публикацию

`Подготовить публикацию` относится к release boundary после того, как approved editorial batch уже находится в `dev`.

Trusted publication policy выполняется из `prod` и должна проверять полный `dev -> prod` diff. Она может создать или переиспользовать pull request `dev -> prod`, но не должна merge PR и автоматически deploy production.

Подготовка publication никогда не должна публиковать напрямую из `content/text-cms`.

## Docs и AGENTS.md

Даже если Pages CMS позволяет открыть или изменить documentation/agent files, `docs/**` и `AGENTS.md` являются engineering changes.

Они не должны проходить CMS-only publication allowlist как обычный content-only release. Такие изменения публикуются через normal engineering flow.
