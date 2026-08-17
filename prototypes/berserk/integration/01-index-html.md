# 01 — index.html

Меняется только структура Berserk Timer внутри CV-аккордеона.

## 1. Удалить старый Berserk из Awful Tools

В текущем `prod` Berserk находится внутри `Awful Tools` как:

```html
<section class="cv-story cv-story--tool-preview" data-cv-sheet="">
  ...
  <awful-tool-preview project="berserk-timer" data-awful-tool="berserk-timer">
    ...
  </awful-tool-preview>
</section>
```

Удалить **только эту `cv-story--tool-preview` секцию, содержащую `project="berserk-timer"`**.

Не удалять `<awful-tool-preview>` других проектов и не менять структуру `Awful Tools` вокруг неё.

## 2. Добавить новую CV-сцену последней

Содержимое файла:

```text
snippets/berserk-timer-accordion-item.html
```

вставить непосредственно перед закрывающим `</div>` элемента:

```html
<div class="cv-accordion__list" data-cv-accordion-list="">
```

то есть **после всех существующих `.cv-item`**.

Не добавлять `data-cv-theme`. Цвет должен назначить существующий `nth-child`-цикл.

Не прогонять formatter, который добавляет пробелы внутрь `<pre>`: пробелы в ASCII и CLI output являются видимым содержимым.

## После изменения

Должно выполняться:

- `[data-berserk-timer-case]` встречается один раз;
- Berserk Timer — последний `.cv-item`;
- старого `<awful-tool-preview ... berserk-timer>` больше нет;
- порядок всех остальных `.cv-item` не изменился.
