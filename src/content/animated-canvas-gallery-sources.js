const DEMO_IMAGES = Object.freeze([
  "/media/projects/shootings/01/source/01-32x45.webp",
  "/media/projects/shootings/01/source/02-2x3.webp",
  "/media/projects/shootings/01/source/03-4x5.webp",
  "/media/projects/shootings/02/source/01-4x5.webp",
  "/media/projects/shootings/02/source/02-4x5.webp",
  "/media/projects/shootings/02/source/03-4x5.webp",
  "/media/projects/shootings/02/source/04-4x5.webp",
  "/media/projects/shootings/03/source/01-4x5.webp",
  "/media/projects/shootings/03/source/02-29x40.webp",
  "/media/projects/shootings/03/source/03-1129x1280.webp",
  "/media/projects/shootings/04/source/01-4x5.webp",
  "/media/projects/shootings/04/source/02-4x5.webp",
  "/media/projects/shootings/04/source/03-4x5.webp",
  "/media/projects/shootings/04/source/04-125x172.webp",
  "/media/projects/shootings/04/source/05-4x5.webp",
  "/media/projects/shootings/05/source/01-1x1.webp",
  "/media/projects/shootings/06/source/01-2x3.webp",
  "/media/projects/shootings/06/source/02-2x3.webp",
  "/media/projects/shootings/06/source/03-4x5.webp",
  "/media/projects/shootings/07/source/01-4x5.webp",
  "/media/projects/shootings/07/source/02-121x125.webp",
  "/media/projects/shootings/07/source/03-4x5.webp",
  "/media/projects/shootings/08/source/01-99x140.webp",
  "/media/projects/shootings/08/source/02-4x5.webp",
]);

const createStockItems = (name, count = 24) =>
  Array.from({ length: count }, (_, index) => {
    const number = index + 1;

    return {
      src: DEMO_IMAGES[index % DEMO_IMAGES.length],
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
