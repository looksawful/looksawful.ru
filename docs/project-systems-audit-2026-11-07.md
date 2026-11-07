# Реестр продуктовых проектов (аудит 2026-11-07)

Статус: проектный scaffold в review. Источник истины по проектам — `src/data/catalog/projects/other.ts`; по маршрутам — `src/site/pages/manifest.ts`; по карточкам — `src/data/content/useful-projects.ts` + CMS JSON. Здесь нет второго исполняемого реестра.

| Проект | GitHub | Route | Статус карточки |
|---|---|---|---|
| Awful Cases | [awful-cases](https://github.com/looksawful/awful-cases) | `/work/awful-cases/` | Уже live; существующее поведение не менять |
| Moves Awful | [moves-awful](https://github.com/looksawful/moves-awful) | `/work/moves-awful/` | Уже live; существующее поведение не менять |
| SEA | отдельный приватный репозиторий | `/work/sea/` | Новый hidden scaffold в «Полезном»; существующий direct-link route не менять |
| Sophisticated | [sophisticate](https://github.com/looksawful/sophisticate) | `/work/sophisticate/` | hidden, enabled=false, нет сборки HTML |
| Epson Driver | приватный репозиторий сканера | `/work/epson-driver/` | hidden, enabled=false, нет сборки HTML |
| AWFUL STUDIO | [awful-studio](https://github.com/looksawful/awful-studio) | `/work/awful-studio/` | Уже live; существующее поведение не менять |
| Berserk Timer | [berserk-timer](https://github.com/looksawful/berserk-timer) | `/work/berserk-timer/` | Уже live; существующее поведение не менять |

## Публикация

- Видимость карточки задаётся `src/content/useful-projects.json`; `state: hidden` и `visible: false` исключают карточку из рендера.
- Маршрут будущей страницы присутствует в manifest с `enabled: false`, `listed: false`, `indexable: false` и не эмитируется в статическую сборку.
- Для скрытых карточек не подставлять чужие изображения. Перед включением требуется собственная проверенная запись Media Catalog, редактура контента, QA и явное разрешение на публикацию.
- Наличие `noindex` у существующих страниц означает скрытие из индексации, **не** запрет прямого доступа.
- GitBook описывает дизайн и паттерны; Storybook воспроизводит реализованные компоненты и состояния. Для Blender/CLI/нативных окон браузерные референсы не подтверждают выполнение нативных функций.
- Дальнейшая работа: GitHub Issues #930 (draft pages), #320 (unpublished output), #861 (Storybook parity). Не плодить параллельные проекты/сущности.
