# CMS handbook

Pages CMS используется для обычного редакторского контента и разрешённых metadata. Маршруты, ID, layout, runtime и инженерный код через него менять не нужно.

## Ветви и источник истины

`prod` — active working / integration / production / deployment source-of-truth branch проекта.

`dev` — archive only. Архивная ветвь сохраняется для истории, но не используется для текущего CMS authoring, Media Desk, preview, deployment или release flow.

Редакторская работа, требующая Git-записи, выполняется в изолированной временной ветви `content/*`, созданной от свежего `origin/prod`. CMS/Desk не должны писать напрямую в `prod` или архивный `dev`.

Типовой поток:

```text
fresh origin/prod
  -> temporary content/* branch or isolated worktree
  -> CMS / Media Desk edits
  -> validation
  -> explicit user READY / «готово»
  -> reviewed PR to prod
  -> normal prod deployment
```

Если интерфейс Pages CMS ещё технически привязан к старой ветви или workflow, это migration debt, а не разрешение использовать старую topology. До миграции такой путь нельзя считать текущим безопасным authoring flow.

## Save

`Save` создаёт реальный Git commit в выбранной CMS branch. Перед сохранением writable CMS session должна показывать точную ветвь, HEAD/base revision и target.

Разрешённая writable branch — только временная `content/*`, созданная от свежего `origin/prod` и прошедшая branch/worktree guard.

Сохранение в authoring branch не является production deployment и само по себе не меняет опубликованный сайт.

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

Media Desk — operator UI поверх того же canonical CMS/media boundary, а не отдельная CMS. Обычный browse-запуск должен быть read-only и не должен синхронизировать или менять repository state просто из-за открытия интерфейса.

Лимиты и детали загрузки описаны отдельно в `docs/media-upload-policy.md`.

## Проверка

Authoring candidate проверяется на точном SHA временной `content/*` ветви. Проверка ничего не публикует и не должна менять canonical authored state.

Перед PR необходимы релевантные narrow checks, а перед merge — обязательные repository gates для candidate SHA.

Если проверка не прошла, изменение не продвигается в `prod` до выяснения причины.

## Подготовка к публикации

После явного `готово` редакторский candidate сравнивается со свежим `origin/prod`, проверяется на допустимый content/media-only scope и открывает reviewed PR в `prod`.

Подготовка не должна автоматически merge PR, обходить проверки или давать authoring branch самостоятельную deployment authority.

Некоторые существующие repository workflows всё ещё могут содержать старые branch assumptions. Пока отдельный migration PR не переведёт их на эту модель и не докажет GREEN тестами, они считаются implementation debt и не переопределяют данный branch contract.

## Docs и AGENTS.md

Даже если Pages CMS позволяет открыть или изменить documentation/agent files, `docs/**`, `.agents/**` и `AGENTS.md` являются engineering changes.

Они не должны проходить CMS-only allowlist как обычный content-only candidate. Такие изменения выполняются через normal engineering branch от свежего `origin/prod` и reviewed PR в `prod`.
