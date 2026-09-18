# Pet pages roadmap — 2026-09-18

## Цель

Привести все pet-проекты looksawful.ru к одной архитектуре страниц без переписывания уже согласованных текстов и обложек, без параллельного разведения множества веток и без публикации незавершённых проектов.

## Общий контракт страницы

Каждый pet-проект проходит один и тот же цикл:

1. canonical project id и `/work/<slug>/`;
2. typed project/entity content;
3. Media Catalog / Media Desk ownership;
4. существующие согласованные тексты и cover используются без самовольной редакции;
5. отдельная подборка project media, без публикации исходников;
6. интерактив/анимация только через уже существующие компоненты сайта, если это улучшает подачу;
7. mobile + reduced motion;
8. direct-link/unlisted/noindex для разработки;
9. card становится `live` только после готовой страницы;
10. typecheck + focused tests + production build + browser smoke;
11. затем интеграция в `dev`, отдельно promotion `dev -> prod`;
12. временные preview/QA/export-файлы удаляются, канонические источники фиксируются в docs.

## Очередь

### P0 — привести существующие шесть карточек к одному уровню

- [ ] **Awful Mockups**
  - страница и 8 web-preview уже собраны локально;
  - сохранить выбранную ранее обложку карточки без изменений;
  - завершить push/merge/deploy;
  - после deploy удалить временный worktree/QA и сохранить только канонические PSD + web assets.

- [x] **Berserk Timer** — архитектура и CI интегрированы в `dev`
  - canonical `/work/berserk-timer/`;
  - legacy `/pets/berserk-timer/` редиректит на canonical route;
  - useful-project href переведён;
  - специализированный terminal runtime и тексты сохранены;
  - browser QA audio/player/responsive остаётся в общем визуальном проходе.

- [x] **Awful Studio** — архитектура, media ownership и CI интегрированы в `dev`
  - страница использует production model-viewer;
  - подключены iPhone 17, iPad Pro 11 и MacBook Pro 14;
  - карточка ведёт на canonical route и переведена в `live`;
  - согласованные intro и cover сохранены;
  - browser QA остаётся в общем визуальном проходе.

- [x] **Awful 3D Mockups** — отдельный project entity интегрирован в `dev`
  - canonical `/work/awful-3d-mockups/`;
  - четыре production-модели: iPhone 17, iPad Pro 11/13, MacBook Pro 14;
  - отдельный project id, presentation, media ownership и CMS identity;
  - карточка live; страница остаётся unlisted/noindex;
  - browser QA остаётся в общем визуальном проходе.

- [ ] **Awful Cases**
  - существующая live-страница;
  - специализированная game-секция теперь присутствует в private Storybook и прошла browser smoke;
  - production game-runtime не менялся, чтобы не конфликтовать с параллельной доработкой;
  - остаётся визуальный аудит route, controls/hotkeys, media, mobile, reduced-motion и links.

- [ ] **Moves Awful**
  - существующая live-страница;
  - specialized canvas demo теперь присутствует в private Storybook и прошёл browser smoke;
  - production runtime уже покрыт e2e проверкой на canvas error-state;
  - остаётся визуальный аудит gallery variants, mobile, reduced-motion и reuse API.

### P1 — подготовить существующий roadmap как настоящие page entities

Следующие проекты создаются по одному. До готовности они disabled/unlisted/noindex и без кликабельной live-карточки:

- [ ] Awful Textures
- [ ] Photoshop Translation
- [x] Keys — canonical direct-link/noindex page интегрирована в `dev`; визуальные media/cover ждут screenshot-pass
- [x] Sea — canonical direct-link/noindex page интегрирована в `dev`; приватный repository не раскрывается
- [ ] Comfy Workflows
- [ ] Photoshop Workflows
- [ ] Blender Scenes
- [ ] Shaders
- [ ] 3D Assets

Для каждого сначала фиксируются:
- существующий код/репозиторий/локальные источники;
- canonical media;
- фактический статус готовности;
- страничный контент из уже существующих материалов;
- только затем page scaffold и presentation.

## Порядок исполнения

`Awful Mockups -> Berserk Timer -> Awful Studio -> Awful 3D Mockups -> Awful Cases audit -> Moves Awful audit -> P1 по одному проекту`.

Новая ветка создаётся только когда текущая интегрирована или закрыта. Production не используется как рабочая ветка.

## Текущий блокер

`Awful Mockups` полностью собран в локальном F:-worktree, но ещё не отправлен в GitHub: push заблокирован GitHub email-privacy guard, а Titan после этого потерял transport-сессию. При восстановлении связи сначала меняется локальный commit author на GitHub noreply, затем ветка ребейзится на свежий `origin/dev`, прогоняются проверки и только после этого отправляется PR.
