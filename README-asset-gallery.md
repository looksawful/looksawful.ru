# asset gallery page patch

Добавляет самостоятельную страницу `/gallery/`, стили и js-фильтр, добавляет ссылку на `/gallery/` в шапку главной страницы и переводит ссылку «резюме» на отдельную страницу `/resume/`.

Файлы:
- gallery/index.html
- src/styles/modules/asset-gallery.css
- src/visuals/dom/asset-gallery.js
- tools/apply-asset-gallery.mjs

После распаковки запускать из корня проекта:

node tools/apply-asset-gallery.mjs
npm run build
