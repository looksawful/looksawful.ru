# CMS handbook

Pages CMS используется для обычного редакторского контента и разрешённых metadata. Маршруты, ID, layout, runtime и инженерный код через него менять не нужно.

## Рабочая ветвь

Обычная работа в CMS выполняется в `dev`.

Для обычного редактирования всегда используй `dev` независимо от GitHub default branch. Перед редактированием убедись, что в Pages CMS выбрана именно `dev`.

## Save

`Save` создаёт реальный Git commit в выбранной CMS branch. Для обычного редактирования используется `dev`.

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

## Проверить сайт

`Проверить сайт` запускает существующий fast verification flow для `dev`. Проверка ничего не публикует.

Если проверка не прошла, изменение не нужно продвигать в production до выяснения причины.

## Подготовить публикацию

`Подготовить публикацию` запускает trusted publication workflow из `prod`.

Он должен:

1. убедиться, что CMS source — `dev`, а trusted policy выполняется из `prod`;
2. проверить допустимость текущего состояния и полного `dev -> prod` diff;
3. пропустить только разрешённый CMS-only scope;
4. создать или переиспользовать pull request `dev -> prod`.

Подготовка публикации не должна merge PR и не должна автоматически deploy production. Merge и production deployment остаются отдельным release-действием.

## Docs и AGENTS.md

Даже если Pages CMS позволяет открыть или изменить documentation/agent files, `docs/**` и `AGENTS.md` являются engineering changes.

Они не должны проходить CMS-only publication allowlist как обычный content-only release. Такие изменения публикуются через normal engineering flow.
