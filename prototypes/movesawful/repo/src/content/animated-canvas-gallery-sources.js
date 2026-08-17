const MOVES_AWFUL_MEDIA = Object.freeze([
  "/media/projects/shootings/01/source/02-2x3.webp",
  "/media/projects/shootings/02/source/04-4x5.webp",
  "/media/projects/shootings/05/source/01-1x1.webp",
  "/media/projects/shootings/06/source/01-2x3.webp",
  "/media/projects/shootings/07/source/02-121x125.webp",
  "/media/projects/shootings/11/source/01-1x1.webp",
  "/media/projects/shootings/11/source/05-2x3.webp",
  "/media/projects/shootings/14/source/01-5x4.webp",
  "/media/projects/shootings/15/source/02-256x181.webp",
  "/media/projects/shootings/19/source/01-4x5.webp",
  "/media/projects/shootings/19/source/03-1553x2135.webp",
  "/media/projects/shootings/04/source/01-4x5.webp",
  "/media/projects/shootings/03/source/03-1129x1280.webp",
  "/media/projects/shootings/10/source/02-2x3.webp",
  "/media/projects/shootings/17/source/01-4x5.webp",
  "/media/projects/shootings/08/source/01-99x140.webp",
]);

const MOVES_AWFUL_ITEMS = Object.freeze(
  MOVES_AWFUL_MEDIA.map((src) =>
    Object.freeze({
      src,
      title: "",
    }),
  ),
);

/*
 * This manifest owns content sources only.
 * All six Moves Awful variants intentionally share one local media pool;
 * rendering, activity and motion remain owned by animated-canvas-gallery.
 */
export const ANIMATED_CANVAS_GALLERY_SOURCES = Object.freeze({
  "moves-arc": MOVES_AWFUL_ITEMS,
  "moves-spiral": MOVES_AWFUL_ITEMS,
  "moves-horizontal": MOVES_AWFUL_ITEMS,
  "moves-diagonal": MOVES_AWFUL_ITEMS,
  "moves-showcase-diagonal": MOVES_AWFUL_ITEMS,
  "moves-masonry": MOVES_AWFUL_ITEMS,
});
