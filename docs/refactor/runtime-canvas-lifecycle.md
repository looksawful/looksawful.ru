# remaining refactor step 2 — runtime and visual lifecycle baseline

Дата: 2026-07-02

## задача

Этот шаг закрывает недостающие runtime helpers из остаточного плана и фиксирует безопасный lifecycle-контракт для будущей чистки canvas/visual scenes.

## что добавлено

- `src/runtime/schedule.js` — единая точка scheduling: `runAfterFirstPaint`, `runWhenIdle`, `runAfterDomReady`, `runMicrotask`.
- `src/runtime/visibility.js` — единая точка visibility/near-viewport запуска: `observeVisibility`, `runWhenNear`.
- `src/runtime/visual-lifecycle.js` — общий контракт для визуальных mount/cleanup: `mountOnce`, `cleanupMount`, `cleanupElement`, `createVisualLifecycleRegistry`, `cleanupVisualLifecycles`.

## runtime boundaries

`mount-engine.js` должен импортировать scheduling и visibility из отдельных helpers, а не держать всё в `dom.js`.

`components/index.js` пока остаётся bridge. Его полная разборка переносится на следующий безопасный runtime/component pass, потому что сейчас важно не сломать шапку, lightbox, heading animations, inline video и другие production-модули.

## visual lifecycle

Canvas-сцены пока не переписаны насильно. Добавлен общий lifecycle-контракт и audit-scan, который показывает, где остаются локальные `activeAnimations`, `pendingMounts`, `imageCache`, `requestAnimationFrame`.

Удалять локальные lifecycle-состояния нужно только после визуального QA каждой сцены:

- before-after;
- landing arc;
- landing masonry;
- showcase diagonal;
- showcase horizontal;
- logo inspector / Three scenes.

## критерий готовности шага

- audit step2 весь `ok`;
- build проходит;
- round5 guards сохранены;
- pet iframe отсутствуют на главной;
- media data-contract сохранён;
- visual registry и runtime registry сохранены.
