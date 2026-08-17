# Berry Agency — production-ready integration v30

Архив содержит только текущую утверждённую Berry Agency и минимальный код, необходимый для того, чтобы она вела себя как reference-прототип внутри существующего `looksawful.ru`.

Главный принцип пакета: Berry не создаёт вторую архитектуру сайта.

Он использует существующие:
- CV accordion lifecycle;
- Rubik и глобальные font-weight tokens;
- accordion scene color sequence;
- `--item-text` / `--item-body-bg`;
- `.stack`, `.grid-flow`, `.reel`;
- `accordion-presentation` media-surface contract.

Добавлен только один маленький JS-компонент для mobile/touch captions. Он не использует observer'ы, timer'ы, animation loop, GSAP или собственный lifecycle.

## Что внутри

- `snippet/berry-agency-section.html` — production-разметка Berry.
- `files/src/components/berry-case/berry-case.css` — локальная композиция/адаптив/hover/tap-state presentation.
- `files/src/components/berry-case/berry-case.js` — touch/pen tap detector для caption.
- `files/src/components/phone-mockup/phone-mockup.css` — CSS-only phone shell.
- `reference/berry-agency-prototype.html` — контрольный standalone.
- `install.mjs` — preflight + установка.
- `tools/verify-berry-integration.mjs` — проверка результата.
- `docs/INTEGRATION.md` — точный порядок интеграции.
- `docs/VISUAL-CONTRACT.md` — что именно должно быть видно и как работать.
- `docs/FILE-MAP.md` — назначение файлов.

## Установка

Из корня репозитория:

```bash
node <bundle>/install.mjs --check .
node <bundle>/install.mjs .
node <bundle>/tools/verify-berry-integration.mjs .
npm test
npm run build
```

`--check` ничего не записывает.

## Важное

Пакет не изменяет:
- `package.json`;
- глобальные theme tokens;
- порядок цветовых тем accordion;
- Rubik;
- `patterns.css`;
- `cv-accordion`;
- `accordion-presentation`;
- motion preference;
- остальные проекты.

Desktop captions: hover/focus.

Touch/pen captions: короткий tap открывает; tap по той же фотографии закрывает; tap по другой открывает её и закрывает предыдущую. Горизонтальный swipe первой группы не считается tap.
