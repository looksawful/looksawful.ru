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

const SENSETIQUE_PRODUCTION_MASONRY_MEDIA = Object.freeze([
  "/media/projects/sensetique/09/source/22-457x640.webp",
  "/media/projects/sensetique/09/source/23-457x640.webp",
  "/media/projects/sensetique/11/source/29-197x256.webp",
  "/media/projects/sensetique/11/source/35-4x5.webp",
  "/media/projects/sensetique/11/source/37-1023x1280.webp",
  "/media/projects/sensetique/11/source/41-4x5.webp",
  "/media/projects/sensetique/11/source/45-853x1280.webp",
  "/media/projects/sensetique/11/source/47-853x1280.webp",
  "/media/projects/sensetique/11/source/50-853x1280.webp",
  "/media/projects/sensetique/11/source/55-853x1280.webp",
  "/media/projects/sensetique/11/source/56-5x4.webp",
  "/media/projects/sensetique/11/source/58-1280x799.webp",
  "/media/projects/sensetique/11/source/60-1280x799.webp",
  "/media/projects/sensetique/11/source/64-457x640.webp",
  "/media/projects/sensetique/04/source/14-4x5.webp",
  "/media/projects/sensetique/11/source/65-853x1280.webp",
  "/media/projects/sensetique/11/source/66-4x5.webp",
  "/media/projects/sensetique/11/source/68-4x5.webp",
  "/media/projects/sensetique/11/source/81-40x71.webp",
  "/media/projects/sensetique/11/source/83-40x71.webp",
  "/media/projects/sensetique/09/source/13-2x3.webp",
  "/media/projects/sensetique/05/source/02-4x5.webp",
  "/media/projects/sensetique/11/source/88-128x175.webp",
  "/media/projects/sensetique/11/source/89-103x140.webp",
  "/media/projects/sensetique/11/source/90-117x160.webp",
  "/media/projects/sensetique/11/source/92-47x70.webp",
  "/media/projects/sensetique/11/source/93-128x175.webp",
  "/media/projects/sensetique/04/source/08-2x3.webp",
  "/media/projects/sensetique/04/source/16-4x5.webp",
  "/media/projects/sensetique/09/source/33-4x5.webp",
  "/media/projects/sensetique/09/source/36-4x5.webp",
  "/media/projects/sensetique/11/source/02-4x5.webp",
  "/media/projects/sensetique/13/source/39-4x5.webp",
  "/media/projects/sensetique/13/source/42-4x5.webp",
  "/media/projects/sensetique/13/source/45-4x5.webp",
  "/media/projects/sensetique/13/source/48-4x5.webp",
  "/media/projects/sensetique/12/source/07-3x4.webp",
  "/media/projects/sensetique/13/source/52-4x5.webp",
  "/media/projects/sensetique/13/source/53-4x5.webp",
  "/media/projects/sensetique/13/source/54-4x5.webp",
  "/media/projects/sensetique/13/source/55-4x5.webp",
  "/media/projects/sensetique/13/source/56-4x5.webp",
  "/media/projects/sensetique/04/source/10-4x5.webp",
  "/media/projects/sensetique/09/source/11-857x1200.webp",
  "/media/projects/sensetique/09/source/18-4x5.webp",
  "/media/projects/sensetique/09/source/19-2x3.webp",
  "/media/projects/sensetique/13/source/60-3x4.webp",
  "/media/projects/sensetique/13/source/61-914x1280.webp",
  "/media/projects/sensetique/13/source/62-852x1280.webp",
]);

const toGalleryItems = (sources) =>
  Object.freeze(
    sources.map((src) =>
      Object.freeze({
        src,
        title: "",
      }),
    ),
  );

const MOVES_AWFUL_ITEMS = toGalleryItems(MOVES_AWFUL_MEDIA);
const SENSETIQUE_PRODUCTION_MASONRY_ITEMS = toGalleryItems(
  SENSETIQUE_PRODUCTION_MASONRY_MEDIA,
);

/*
 * This manifest owns content sources only. Rendering, activity and motion
 * remain owned by animated-canvas-gallery and the shared accordion runtime.
 */
export const ANIMATED_CANVAS_GALLERY_SOURCES = Object.freeze({
  "moves-arc": MOVES_AWFUL_ITEMS,
  "moves-spiral": MOVES_AWFUL_ITEMS,
  "moves-horizontal": MOVES_AWFUL_ITEMS,
  "moves-diagonal": MOVES_AWFUL_ITEMS,
  "moves-showcase-diagonal": MOVES_AWFUL_ITEMS,
  "moves-masonry": MOVES_AWFUL_ITEMS,
  "sensetique-production-masonry": SENSETIQUE_PRODUCTION_MASONRY_ITEMS,
});
