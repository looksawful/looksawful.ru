# 03 — src/content/accordion-content.js

Berserk Timer использует собственную разметку кейса и не нуждается в generic description/intro/principle/brief blocks.

В `PROJECT_CONTENT` рядом с `Awful Tools` добавить:

```js
"Berserk Timer": {
  hideDescription: true,
  hideIntro: true,
  hidePrinciple: true,
  hideBriefs: true,
},
```

Это не задаёт контент или дизайн секции. Запись только сообщает существующему `applyAccordionContent`, что generic блоки для этой сцены не нужны.

Никаких изменений в `findScene`, `applyProjectContent` и остальных функциях делать не требуется.
