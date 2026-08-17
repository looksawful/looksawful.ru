# Интеграция

## 1. Начать с prod

```powershell
git switch prod
git status
git rev-parse HEAD
```

Пакет проверен против:

`7caa2af97df75197a8dd91c4f38fb3c937e0473a`

Если HEAD уже другой, сначала проверить актуальные `index.html` и `src/main.js`. Не применять `--allow-drift` автоматически.

## 2. Скопировать `site-patch/`

Скопировать содержимое `site-patch/` в корень репозитория, сохранив пути.

Пакет добавляет только:

- `src/components/mobile-mockup/mobile-mockup.css`
- `src/components/sands-showcase/sands-showcase.css`
- `tools/sands-showcase/sands-article.html`
- `tools/apply-sands-showcase.mjs`
- `test/sands-showcase-contract.test.js`

Он НЕ заменяет:
- `media-marquee.js/css`;
- `media-slider.js/css`;
- `accordion-presentation.js/css`;
- `cv-accordion.js/css`;
- `tokens.css`.

## 3. Применить сцену

```powershell
node tools/apply-sands-showcase.mjs
```

Installer:
1. находит article через `cv-trigger-06`;
2. убеждается, что это `data-cv-theme="ss"`;
3. заменяет только этот article;
4. добавляет импорт `mobile-mockup.css`;
5. добавляет импорт `sands-showcase.css`;
6. не меняет JS imports и mount sequence.

## 4. Нельзя добавлять при интеграции

- новый S&S JS runtime;
- новый observer любого типа;
- новый accordion lifecycle;
- отдельную цветовую тему;
- отдельный font import;
- `data-media-marquee-pause-on-hover`;
- глобальное включение `media-slider`;
- новый нижний marquee;
- второй phone mockup;
- удалённые S&S media;
- hidden-копии удалённых блоков внутри active accordion DOM;
- S&S branches внутри общих компонентов.

## 5. Проверки

```powershell
npm test
npm run build
git diff --check
```

После сборки проверить desktop + реальное touch/mobile устройство или device emulation с coarse pointer.

## 6. Основная проверка регрессий

После интеграции diff должен показывать:
- замену одного S&S article;
- два новых CSS imports;
- два локальных CSS-файла;
- installer/test files.

Не должно быть diff в:
- `src/components/media-marquee/*`;
- `src/components/media-slider/*`;
- `src/content/accordion-presentation.*`;
- `src/components/cv-accordion/*`;
- `src/styles/tokens.css`.
