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

- [ ] **Berserk Timer**
  - сохранить текущий контент и визуальный стиль;
  - создать canonical `/work/berserk-timer/`;
  - старый `/pets/berserk-timer/` оставить совместимым маршрутом/redirect, а не второй независимой страницей;
  - перевести useful-project href на canonical route;
  - проверить audio/player, responsive и mobile;
  - не менять текст без отдельной причины.

- [ ] **Awful Studio**
  - entity-page уже существует, карточка пока `coming-soon`;
  - сверить страницу с актуальным Storybook/3D runtime;
  - использовать только финальные/актуальные модели;
  - довести media presentation и browser QA;
  - включать `live` только после визуального прохода.

- [ ] **Awful 3D Mockups**
  - создать entity-page scaffold `/work/awful-3d-mockups/`;
  - связать с актуальным 3D pipeline/Storybook;
  - показать curated renders/viewer, а не весь сырой набор;
  - до готовности оставить unlisted/noindex/coming-soon.

- [ ] **Awful Cases**
  - существующая live-страница;
  - только аудит: route, тексты, controls/hotkeys, media, mobile, reduced-motion, links;
  - исправлять реальные дефекты без редизайна ради редизайна.

- [ ] **Moves Awful**
  - существующая live-страница;
  - аудит gallery variants, mobile, reduced-motion и reuse API;
  - сохранить её как библиотеку motion-компонентов и источник reusable gallery runtime.

### P1 — подготовить существующий roadmap как настоящие page entities

Следующие проекты создаются по одному. До готовности они disabled/unlisted/noindex и без кликабельной live-карточки:

- [ ] Awful Textures
- [ ] Photoshop Translation
- [ ] Keys
- [ ] Sea
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
