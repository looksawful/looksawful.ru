const MOVES_STOCK_SOURCES = Object.freeze([
  "https://images.unsplash.com/photo-1547349676-848a77c00e8c?auto=format&fit=crop&w=512&h=512&q=55",
  "https://images.unsplash.com/photo-1755018237266-d75ba7be9ebe?auto=format&fit=crop&w=512&h=512&q=55",
  "https://images.unsplash.com/photo-1756251585616-104f3d53ca94?auto=format&fit=crop&w=512&h=512&q=55",
  "https://images.unsplash.com/photo-1730105920903-0b4a863fa675?auto=format&fit=crop&w=512&h=512&q=55",
  "https://images.unsplash.com/photo-1524685364536-a6f820f6c5ce?auto=format&fit=crop&w=512&h=512&q=55",
]);

const createStockItems = (count = 24) =>
  Array.from({ length: count }, (_, index) => ({
    src: MOVES_STOCK_SOURCES[index % MOVES_STOCK_SOURCES.length],
    title: "",
  }));

/*
 * Здесь хранятся только источники контента.
 * Компонент ничего не знает о проектах сайта.
 *
 * В этом пакете manifest используется только шестью preview в Moves Awful.
 * Встраиваемые экземпляры Styx и Sensetique читают реальные изображения
 * непосредственно из сохранённого [data-gallery-fallback]. Это позволяет
 * не дублировать пути ассетов и сохраняет рабочую версию без JavaScript.
 *
 * Moves Awful переиспользует небольшой набор оптимизированных квадратных
 * изображений. Повторяющиеся URL попадают в кеш загрузчика варианта и браузера,
 * поэтому 20–24 карточки не превращаются в 20–24 уникальные загрузки.
 *
 * Новый именованный источник добавляется только тогда, когда компонент
 * не оборачивает уже существующую медиасетку:
 *
 * "project-gallery": [
 *   { src: new URL("../assets/...", import.meta.url).href, title: "" },
 * ],
 */
export const ANIMATED_CANVAS_GALLERY_SOURCES =
  Object.freeze({
    "moves-arc": createStockItems(16),
    "moves-spiral": createStockItems(16),
    "moves-horizontal": createStockItems(16),
    "moves-diagonal": createStockItems(16),
    "moves-showcase-diagonal": createStockItems(16),
    "moves-masonry": createStockItems(18),
  });
