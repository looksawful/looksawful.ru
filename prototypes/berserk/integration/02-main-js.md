# 02 — src/main.js

Новый компонент подключается тем же способом, которым `main.js` монтирует другие accordion-aware consumers.

## CSS import

Сразу после существующего:

```js
import "./components/awful-tools-preview/awful-tools-preview.css";
```

добавить:

```js
import "./components/berserk-timer-case/berserk-timer-case.css";
```

## JS import

Рядом с импортом `setAwfulToolsAccordionRuntime` добавить:

```js
import { createBerserkTimerCases } from "./components/berserk-timer-case/berserk-timer-case.js";
```

## Lifecycle variable

Рядом с остальными `destroy*` переменными добавить:

```js
let destroyBerserkTimerCases = null;
```

## unmount()

Berserk использует `accordionRuntime`, поэтому уничтожить его **до** `cvAccordion?.destroy?.()`:

```js
destroyBerserkTimerCases?.();
destroyBerserkTimerCases = null;

// Stop the shared scene runtime before destroying its direct consumers.
cvAccordion?.destroy?.();
```

Не менять порядок уничтожения остальных компонентов.

## mount()

Сначала сайт как и сейчас создаёт CV accordion:

```js
cvAccordion = createCvAccordion({
  root: document,
  motion: motionPreference,
});
const accordionRuntime = cvAccordion?.runtime ?? null;
```

После существующего:

```js
setAwfulToolsAccordionRuntime(accordionRuntime, document);
```

добавить:

```js
destroyBerserkTimerCases = createBerserkTimerCases({
  root: document,
  accordionRuntime,
});
```

Не создавать для Berserk отдельный runtime и не передавать ему состояние через DOM events/`aria-expanded`.
