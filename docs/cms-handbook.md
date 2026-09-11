# CMS handbook

Status: CURRENT Pages CMS operator handbook. CURRENT behavior and open TARGET authoring work are separated explicitly.

Pages CMS используется для обычного редакторского контента и разрешённых metadata. Маршруты, ID, layout, runtime и инженерный код через него менять не нужно.

## Рабочая ветвь

В CURRENT Pages CMS модели обычная работа выполняется в `dev`.

`dev` является GitHub default branch и working/integration branch. `prod` является production/release/deploy branch.

Перед редактированием убедись, что в Pages CMS выбрана именно `dev`. Не используй `prod` как обычную редакторскую ветвь.

### TARGET: изолированное authoring

GitHub #451 отслеживает более безопасную модель параллельной редакторской работы:

```text
fresh dev
  -> temporary content/* branch/worktree
  -> authoring
  -> validation/review
  -> integration into fresh dev
  -> existing dev -> prod publication flow
```

Это TARGET, а не текущая инструкция. Не переключай рабочий процесс на эту схему частично, пока executable tooling/tests и связанные operator docs не будут согласованы вместе.

## Save

`Save` создаёт реальный Git commit в выбранной CMS branch. В CURRENT Pages CMS модели для обычного редактирования используется `dev`.

Сохранение в `dev` не является production deployment и само по себе не меняет опубликованный сайт.

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

GitHub #452/#453 владеют TARGET hardening: read-only-by-default launch, guarded write activation, более строгая source authorization, revision/conflict semantics и atomic persistence. Не считать эти protections реализованными до появления executable evidence.

## Проверить сайт

`Проверить сайт` запускает существующий fast verification flow для `dev`. Проверка ничего не публикует.

Если проверка не прошла, изменение не нужно продвигать в production до выяснения причины.

## Подготовить публикацию

`Подготовить публикацию` запускает trusted publication workflow из `prod`.

Он должен:

1. убедиться, что CURRENT CMS source — `dev`, а trusted policy выполняется из `prod`;
2. проверить допустимость текущего состояния и полного `dev -> prod` diff;
3. пропустить только разрешённый CMS-only scope;
4. создать или переиспользовать pull request `dev -> prod`.

Подготовка публикации не должна merge PR и не должна автоматически deploy production. Merge и production deployment остаются отдельным release-действием.

## Docs и AGENTS.md

Даже если Pages CMS позволяет открыть или изменить documentation/agent files, `docs/**` и `AGENTS.md` являются engineering changes.

Они не должны проходить CMS-only publication allowlist как обычный content-only release. Такие изменения публикуются через normal engineering flow.
