# CMS handbook

Status: CURRENT Pages CMS operator handbook. Project branch policy, executable authoring safeguards and release boundaries are separated explicitly.

Pages CMS используется для обычного редакторского контента и разрешённых metadata. Маршруты, ID, layout, runtime и инженерный код через него менять не нужно.

## Рабочая ветвь

Редактирование и разработка выполняются только в `dev`. Pages CMS сохраняет редакторские изменения непосредственно в `dev`; локальный Content Desk и удалённый Media Desk также пишут только в `dev`, с собственными ограничениями путей, проверками ревизий и авторизации. `prod` является защищённой веткой публичного релиза и не принимает записи редакторов.

`Save` создаёт коммит в `dev`, **не публикуя** сайт. Публикация требует отдельного проверенного `dev → prod` PR и production CI. Краткоживущие feature/PR-ветки не становятся новыми редакторскими средами.

Старый `content/text-cms` сохранён архивным тегом; временную ветку совместимости нельзя удалять до проверки переноса всех writer-адаптеров и сверки старых редакторских отличий. `tools/cms-authoring-topology.mjs` только читает Git-состояние, не переписывает историю.

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

разрешён только на branch `dev`, вне CI/GitHub Actions и без переопределения loopback host. `prod`, legacy editorial, feature/fix branches и remote host override блокируются до запуска write-capable Desk.

В интерфейсе Desk отображаются `READ ONLY`/`WRITE`, current branch, HEAD, dirty state и divergence относительно `dev`.

Write API использует revision-aware optimistic concurrency: mutation требует `expectedRevision`; stale source возвращает `409`; validated single-file writes используют staged replacement; bulk writes prevalidate все candidates и имеют проверенный rollback на mid-bulk failure.

Полный локальный HTTP/write contract описан в `docs/content-media-desk-api.md`.

## Private Lab

Private Lab — отдельная non-production read-only поверхность. Она не является CMS branch, source of truth, deployment authority или способом обойти Desk write policy.

Текущий integration candidate предоставляет только foundation: отдельный build, exact branch/commit/build provenance, `noindex/nofollow/noarchive` и local-only serving на `127.0.0.1`.

Он **не** вводит собственный пароль/Basic Auth. По актуальному #732 удалённый private access должен использовать существующий Admin/GitHub OAuth boundary либо оставаться local-only, пока этот security slice не реализован и не проверен.

Даже успешная network authentication не даёт право на CMS/media mutation. Write authority по-прежнему определяется локальным `dev` authoring contract.

Foundation не считается завершением всего #732: full LIVE/HIDDEN/WIP catalog, hidden organisms/Berserk, viewport/debug tooling и GitHub OAuth/Admin integration остаются отдельным scope.

## Проверить сайт и завершить редакторский цикл

`Проверить сайт` запускает проверки `dev` и не публикует production. Pages CMS, локальный Desk и удалённый Media Desk создают редакторские изменения сразу в `dev`; не требуется отдельный editorial-to-dev merge.

Перед выпуском необходимо проверить сохранённые ревизии и разрешённые пути, отработать проверки контента, сборки и тесты в `dev`. Отдельная проверенная процедура `dev → prod` выпускает сайт. Прямой CMS save в `prod` запрещён.

## Подготовить публикацию

`Подготовить публикацию` относится к release boundary после того, как approved editorial batch уже находится в `dev`.

Trusted publication policy выполняется из `prod` и должна проверять полный `dev -> prod` diff. Она может создать или переиспользовать pull request `dev -> prod`, но не должна merge PR и автоматически deploy production.

Подготовка publication никогда не должна публиковать напрямую из `content/text-cms`.

## Docs и AGENTS.md

Даже если Pages CMS позволяет открыть или изменить documentation/agent files, `docs/**` и `AGENTS.md` являются engineering changes.

Они не должны проходить CMS-only publication allowlist как обычный content-only release. Такие изменения публикуются через normal engineering flow.
