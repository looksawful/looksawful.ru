const BLACK_CARD_SOURCE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#050505"/></svg>',
)}`;

const createStockItems = (name, count = 24) =>
  Array.from({ length: count }, (_, index) => {
    const number = index + 1;

    return {
      src: BLACK_CARD_SOURCE,
      title: `${name} ${String(number).padStart(2, "0")}`,
    };
  });

/*
 * Здесь хранятся только источники контента.
 * Компонент ничего не знает о проектах сайта.
 *
 * В этом пакете manifest используется только шестью preview в Moves Awful.
 * Встраиваемые экземпляры Styx и Sensetique читают реальные изображения
 * непосредственно из сохранённого [data-gallery-fallback]. Это позволяет
 * не дублировать пути ассетов и сохраняет рабочую версию без JavaScript.
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
    "moves-arc": createStockItems("arc", 20),
    "moves-spiral": createStockItems("spiral", 20),
    "moves-horizontal": createStockItems("horizontal", 20),
    "moves-diagonal": createStockItems("diagonal", 20),
    "moves-showcase-diagonal":
      createStockItems("showcase-diagonal", 20),
    "moves-masonry": createStockItems("masonry", 24),
  });
