# CMS handbook

Pages CMS используется для обычного редакторского контента и разрешённых metadata. Маршруты, ID, layout, runtime и инженерный код через него менять не нужно.

## Рабочие ветви

Для ручной редактуры текстов в Pages CMS используется постоянная ветвь `content/text-cms`.

`dev` остаётся рабочей/integration-ветвью сайта и единственным источником контента для существующего `dev -> prod` publication flow. `content/text-cms` — только редакторский staging: изменения из неё не публикуются и не должны попадать в `dev` прямым merge.

Перед новой сессией редактуры `content/text-cms` должна быть синхронизирована с актуальным `dev`, если в ней нет незавершённых правок. Во время активной редактуры ветку не синхронизируют поверх несогласованных изменений.

## Save

`Save` создаёт реальный Git commit в выбранной CMS branch. Для ручной текстовой редактуры выбирай `content/text-cms`; микрокоммиты из CMS допустимы.

Сохранение в `content/text-cms` не меняет `dev`, не запускает production deployment и само по себе не меняет опубликованный сайт.

## Перенос текста в dev

Когда редактура закончена, владелец явно просит перенести изменения. Агент должен:

1. заново прочитать текущие HEAD `content/text-cms` и `dev`;
2. сравнить редакторскую ветвь с последней синхронизацией и выделить реальные текстовые изменения;
3. не переносить случайный CMS-шум, структурные изменения или другие поля без явного разрешения;
4. создать временную integration-ветвь от самого свежего `dev`;
5. применить туда только согласованные текстовые значения;
6. проверить diff и релевантные checks;
7. создать и после разрешения слить PR во `dev`;
8. если в `content/text-cms` больше нет незавершённых правок, синхронизировать её дерево с новым `dev`, сохранив имя ветви и историю без force-push.

`content/text-cms` нельзя использовать как head обычного merge PR: это постоянная ветвь, а в репозитории временные PR-ветки могут автоматически удаляться после merge.

## Что можно менять

Можно менять поля, которые CMS показывает как editorial content или разрешённые metadata: тексты, подписи, описания, credits, теги, taxonomy relations, разрешённые media fields и существующие visibility controls.

Нельзя менять через обычную CMS-работу:

- routes, slugs и canonical URLs;
- стабильные IDs и project/client identity;
- layout, CSS и структуру компонентов;
- runtime, TypeScript/JavaScript и build/deploy code;
- engineering configuration и publication policy.

Для постоянной ветви `content/text-cms` рабочий контракт уже: она предназначена прежде всего для текстовой редактуры. Если CMS вместе с текстом изменила visibility, media fields или структуру JSON, эти изменения не считаются автоматически одобренными для переноса в `dev`.

## Пустые поля

Если редакторское поле optional, его можно полностью очистить. Пустое значение сохраняется как отсутствие текста.

Не используй пробел (`" "`) или другой placeholder, чтобы «спрятать» текст. Structural fields — IDs, routes, taxonomy IDs, media paths и другие обязательные связи — остаются строгими и не являются optional copy.

## Показывать

Переключатель `Показывать` работает только у сущностей, для которых такой control уже предусмотрен текущей моделью. Выключенное значение скрывает соответствующую сущность через существующий runtime contract.

Если у сущности нет `Показывать`, это не означает, что visibility можно добавить произвольно через CMS.

## Media

Существующие reusable media metadata редактируются в Media Catalog. Новые CMS uploads сохраняются как source masters в `public/media/catalog/*`, а их records — в `src/content/media-catalog/uploads/*.json`.

Технические свойства — размеры, MIME, byte length, duration и generated delivery metadata — заполняет tooling. Они не становятся editorial fields. Source master сохраняется.

Постоянная `content/text-cms` не заменяет существующие media workflows, которые технически привязаны к `dev`. Media/source mutation выполняется через текущий `dev`-контракт, если отдельная задача явно не меняет эту архитектуру.

Лимиты и детали загрузки описаны отдельно в `docs/media-upload-policy.md`.

## Проверить сайт

`Проверить сайт` запускает существующий fast verification flow для `dev`, а не для `content/text-cms`.

Поэтому текстовые изменения из staging-ветви проверяются после переноса на временную integration-ветвь/PR в `dev` либо уже на `dev`. Проверка ничего не публикует.

Если проверка не прошла, изменение не нужно продвигать в production до выяснения причины.

## Подготовить публикацию

`Подготовить публикацию` запускает trusted publication workflow из `prod` и работает с `dev` как source branch. `content/text-cms` в этом trust boundary не участвует.

Он должен:

1. убедиться, что publication source — `dev`, а trusted policy выполняется из `prod`;
2. проверить допустимость текущего состояния и полного `dev -> prod` diff;
3. пропустить только разрешённый CMS-only scope;
4. создать или переиспользовать pull request `dev -> prod`.

Подготовка публикации не должна merge PR и не должна автоматически deploy production. Merge и production deployment остаются отдельным release-действием.

## Docs и AGENTS.md

Даже если Pages CMS позволяет открыть или изменить documentation/agent files, `docs/**` и `AGENTS.md` являются engineering changes.

Они не должны проходить CMS-only publication allowlist как обычный content-only release. Такие изменения публикуются через normal engineering flow.
