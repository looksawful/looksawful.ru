# Berserk Timer — checklist после интеграции

## Diff

- [ ] В Git diff появились только 4 точечно изменённых существующих файла и 3 новых production/test файла.
- [ ] Ни один общий CSS-файл сайта не изменён.
- [ ] `cv-accordion.js` и `cv-accordion-runtime.js` не изменены.
- [ ] Нет `data-cv-theme` на Berserk Timer.
- [ ] Порядок прежних accordion scenes не изменён.

## Desktop

- [ ] Berserk открывается существующей механикой CV accordion.
- [ ] Фон/foreground сцены приходят от текущей темы аккордеона.
- [ ] Rubik используется для внешнего текста и captions.
- [ ] CLI/terminal остаются моноширинными только внутри мокапов.
- [ ] 6 gallery slides доступны prev/next, drag и dots.
- [ ] Grid toggle работает.
- [ ] Caption metadata появляется при hover по подписи.
- [ ] Caption metadata доступна keyboard focus.
- [ ] Audio выбирает alert, play/pause и volume работают.
- [ ] Install/usage copy работают.
- [ ] GitHub/release/download links работают.

## Mobile/touch

- [ ] Нет горизонтального overflow страницы.
- [ ] Terminal/code остаются читаемыми и вписываются в контейнер.
- [ ] Короткая часть caption всегда видна.
- [ ] Tap по caption summary раскрывает metadata.
- [ ] Повторный tap закрывает metadata.
- [ ] Caption tap не требует отдельного JS и не ломает gallery drag.
- [ ] Buttons имеют штатные touch targets сайта.
- [ ] Install/usage перестраиваются штатной логикой `.equal-columns`.

## Lifecycle

- [ ] При переходе на другую CV-сцену gallery autoplay прекращается.
- [ ] При переходе на другую CV-сцену audio ставится на pause.
- [ ] При возврате gallery корректно refit-ится.
- [ ] При `prefers-reduced-motion: reduce` autoplay не запускается.
- [ ] В component JS нет `MutationObserver`.
- [ ] В component JS нет `IntersectionObserver`.
- [ ] Есть только один `ResizeObserver` для gallery viewport.

## Build

```powershell
npm test
npm run build
```

Обе команды должны завершиться без ошибок перед коммитом/деплоем.
