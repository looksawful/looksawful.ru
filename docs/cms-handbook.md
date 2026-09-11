# CMS handbook

Status: CURRENT Pages CMS operator handbook. Project branch policy, current executable behavior and open hardening work are separated explicitly.

Pages CMS используется для обычного редакторского контента и разрешённых metadata. Маршруты, ID, layout, runtime и инженерный код через него менять не нужно.

## Рабочая ветвь

Текущий проектный контракт:

- `dev` — GitHub default branch и working/integration branch;
- `prod` — production/release/deploy branch;
- `content/text-cms` — постоянная редакторская ветвь для Pages CMS/контентных циклов.

Новые редакторские изменения не нужно сохранять напрямую в `dev` или `prod`. Перед новым циклом `content/text-cms` должна быть безопасно сверена с текущим `dev` без force-reset и без скрытого rebase открытой редакторской сессии. GitHub #451 владеет этим reconciliation contract.

Изменения остаются в `content/text-cms`, пока пользователь явно не подтвердит `готово`. После этого batch сверяется с fresh `dev`, проходит content-only validation и интегрируется в `dev`. Production publication остаётся отдельным `dev -> prod` release.

`tools/cms-authoring-topology.mjs` — read-only guard для этой границы. Он показывает текущую ветвь/worktree, HEAD, exact `dev` ref, dirty state, ahead/behind/divergence и intended integration target. Guard не делает reset, rebase, merge или commit и не заменяет ручное разрешение конфликтов.

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

`npm run desk` CURRENTLY запускает write-capable mode: launcher включает `CONTENT_DESK_WRITE=1` / `VITE_CONTENT_DESK_WRITE=1`, а startup выполняет `media:ensure`, который может синхронизировать derived media state до открытия интерфейса.

Поэтому текущий `npm run desk` нельзя считать read-only browser. Локальный HTTP/write contract описан в `docs/content-media-desk-api.md`.

GitHub #452/#453 владеют TARGET hardening: read-only-by-default launch, guarded write activation, более строгая source authorization, revision/conflict semantics и atomic persistence. #451 теперь предоставляет отдельный branch/worktree/READY/scope guard; его наличие не означает, что #452/#453 уже реализованы в Desk transport/persistence.

## Проверить сайт

Текущие `Проверить сайт` actions проверяют `dev`; они не публикуют production.

Для изменений, которые ещё находятся только в `content/text-cms`, authoring topology guard фиксирует branch-specific provenance и drift до интеграции. Проверку `dev` нельзя считать доказательством непроинтегрированного editorial batch.

После интеграции в `dev` существующий verification flow используется как integration gate перед release.

## Интеграция редакторского batch

До явного `готово` изменения остаются в `content/text-cms`.

Перед любым integration decision сначала обнови remote refs обычным безопасным fetch и запусти из checkout `content/text-cms`:

```bash
node tools/cms-authoring-topology.mjs --dev origin/dev
```

До `готово` результат обязан оставаться `integrationAllowed: false` с `integrationReason: "ready-required"`. Если `diverged: true`, guard возвращает `reconciliation-required`: это сигнал для явного conflict/reconciliation review, а не разрешение на автоматическое переписывание истории.

После `готово` передай guard точный список candidate paths, например через `--files-json '["src/content/cases/styx.json"]'`. Он повторно использует канонический CMS publication classifier: `ENGINEERING` и `UNKNOWN` блокируют candidate, а разрешённый CMS-only diff может получить `integrationReason: "ready-and-cms-only"` только на чистом авторизованном checkout без divergence.

После `готово`:

1. получить fresh `dev` и проверить drift `content/text-cms`;
2. не выполнять force-reset и не прятать конфликт автоматическим rebase;
3. убедиться, что batch содержит только ожидаемые editorial/media изменения;
4. выполнить доступные content/media validation checks;
5. интегрировать batch в `dev` через контролируемый review/merge flow;
6. проверить resulting `dev` exact SHA;
7. только после этого рассматривать отдельный `dev -> prod` release.

## Подготовить публикацию

`Подготовить публикацию` относится к release boundary после того, как approved editorial batch уже находится в `dev`.

Trusted publication policy выполняется из `prod` и должна проверять полный `dev -> prod` diff. Она может создать или переиспользовать pull request `dev -> prod`, но не должна merge PR и автоматически deploy production.

Подготовка publication никогда не должна публиковать напрямую из `content/text-cms`.

## Docs и AGENTS.md

Даже если Pages CMS позволяет открыть или изменить documentation/agent files, `docs/**` и `AGENTS.md` являются engineering changes.

Они не должны проходить CMS-only publication allowlist как обычный content-only release. Такие изменения публикуются через normal engineering flow.
