# 04 — src/components/awful-tools-preview/awful-tools-preview.js

После переноса Berserk в собственную CV-сцену общий Awful Tools component больше не должен содержать Berserk-specific runtime.

В текущем `prod` удалить только Berserk-функции:

```text
fitBerserkScreens
enhanceBerserkGallery
enhanceBerserkMusicPlayer
enhanceBerserkTimer
```

Они находятся единым блоком перед `enhanceAwfulToolPreview`.

Из `enhanceAwfulToolPreview` удалить только ветку:

```js
if (project === "berserk-timer") {
  activeRuntimes.push(enhanceBerserkTimer(root));
}
```

Сохранить без изменений:

- `AwfulToolPreview` custom element;
- `createPreviewActivation` для оставшихся Awful Tools;
- `awful-cases` lazy runtime;
- copy behavior Awful Tools;
- `setAwfulToolsAccordionRuntime`.

После изменения файл не должен содержать `enhanceBerserk` или `project === "berserk-timer"`.
