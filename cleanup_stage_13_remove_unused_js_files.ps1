$delete = @(
  "src/components/media-slider-dots-proximity.js",
  "src/visuals/dom/showcase-toc.js",
  "src/visuals/shared/observer.js",
  "src/visuals/dom/demo-shell.js"
)

git rm -- $delete
git commit -m "refactor: remove unused javascript modules"
