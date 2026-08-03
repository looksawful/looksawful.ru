const DEMO_IMAGES = Object.freeze([
  "/assets/media/cases/shootings/_incoming/berry-agency/01-services-model-agency.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/02-services-production.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/03-services-event-management.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/04-services-overview.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/05-who-we-are.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/06-polaroid-leaves.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/07-sofa-suit.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/08-hair-ribbon-detail.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/09-vika-content-instagram.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/10-marusia-portrait.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/11-marusia-chair-long.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/12-marusia-trench-look.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/13-marusia-chair-studio.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/14-marusia-color-portrait.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/15-marusia-chair-side.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/16-marusia-denim-leaf.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/17-marusia-floor.webp",
  "/assets/media/cases/shootings/_incoming/berry-agency/18-marusia-trench-close.webp",
  "/assets/media/cases/shootings/_incoming/evasha-group/01-crouch-dark.webp",
  "/assets/media/cases/shootings/_incoming/evasha-group/02-green-coat.webp",
  "/assets/media/cases/shootings/_incoming/evasha-group/03-burnt-contact-sheet.webp",
  "/assets/media/cases/shootings/_incoming/evasha-group/04-floor-cabinet.webp",
  "/assets/media/cases/shootings/_incoming/evasha-group/05-ripped-denim.webp",
  "/assets/media/cases/shootings/_incoming/evasha-group/06-flash-floor.webp",
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
