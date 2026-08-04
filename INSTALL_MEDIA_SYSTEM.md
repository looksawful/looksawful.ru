# Установка Media System

Архив накладывается поверх текущего проекта. Он не удаляет `MEDIA-TEMP`, старую `public/media/projects` и существующие исходники.

## 1. Распаковать

```powershell
Expand-Archive `
  -LiteralPath "A:\Users\awful\Downloads\media-system-working.zip" `
  -DestinationPath "A:\Users\awful\Documents\CODE\looksawful.ru" `
  -Force
```

## 2. Проверить план без изменений

```powershell
& "A:\Users\awful\Documents\CODE\looksawful.ru\tools\media\run-media-system.ps1"
```

## 3. Применить

```powershell
& "A:\Users\awful\Documents\CODE\looksawful.ru\tools\media\run-media-system.ps1" -Apply
```

Для первого запуска без production build:

```powershell
& "A:\Users\awful\Documents\CODE\looksawful.ru\tools\media\run-media-system.ps1" `
  -Apply `
  -SkipBuild
```

## Что будет изменено

- `package.json` — только scripts;
- `.gitignore` — generated/cache paths;
- `Agents/README.md`;
- `Agents/COMPONENTS.md`;
- `Agents/ARCHITECTURE.md`;
- `index.html` — generated URLs, Media Item markers, surface, empty caption и imports.

Резервные копии:

```text
package.before-media-system.json
index.before-media-item.html
```

## Что будет создано

```text
media/projects/
public/media/generated/
src/generated/media-manifest.json
src/generated/media-manifest.js
.cache/media/
```

## Проверка после установки

```powershell
npm run media:system:test
npm run media:prepare
npm run media:verify
npm run dev
```

Строгий аудит дублей:

```powershell
npm run media:verify:strict
```
