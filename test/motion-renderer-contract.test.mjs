import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  renderEntityIntro as renderProjectIntro,
  renderPortfolioEntityCard as renderProjectCard,
  renderSectionIntro,
} from "../src/components/composition/index.ts";
import {
  renderBeforeAfter,
  renderJustifiedGallery,
  renderMediaFigure,
  renderMediaGroup,
  renderMediaSlider,
  renderMockup,
  renderMockupDeck,
  renderPageFlip,
} from "../src/components/content/index.ts";
import { renderAnimatedCanvasGallery } from "../src/components/specialized/index.ts";
import { projectCardPresentations } from "../src/data/projects.ts";

const imageEntry = "styx-06-source-01-1920x913-use-01";
const secondImageEntry = "styx-06-source-02-1920x917-use-01";
const videoEntry = "sensetique-09-source-56-16x9-use-02";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const revealCount = (html) => html.match(/\bdata-reveal="/g)?.length ?? 0;

function assertNoGlobalReveal(html, label) {
  assert.doesNotMatch(html, /\bdata-reveal(?:=|-group|-rail)/, label);
}

test("project card renderer marks cards while the grid list owns their reveal group", async () => {
  const card = renderProjectCard(projectCardPresentations[0]);
  const index = await read("index.html");

  assert.match(card, /<a[\s\S]*class="project-card"[\s\S]*data-reveal="card"/);
  assert.match(index, /<ol class="projects-grid__list"[^>]*\bdata-reveal-group/);
});

test("project intro renderer exposes separate copy groups for head and intro", () => {
  const html = renderProjectIntro({
    head: { type: "text", text: "Project name" },
    role: "Role",
    period: "2026",
    title: { type: "text", text: "Title" },
    summary: "Summary",
    lead: "Lead",
    links: [{ href: "https://example.com", label: "Link", target: "_blank", rel: "noreferrer" }],
  });

  assert.match(html, /<div class="project__head"[^>]*\bdata-reveal-group/);
  assert.match(html, /<header class="project__intro wrapper prose editorial-grid"[^>]*\bdata-reveal-group/);
  assert.match(html, /<p class="project__name"[^>]*\bdata-reveal="copy"/);
  assert.match(html, /<p class="project__role"[^>]*\bdata-reveal="copy"/);
  assert.match(html, /<p class="project__period"[^>]*\bdata-reveal="copy"/);
  assert.match(html, /<h2 class="project__title"[^>]*\bdata-reveal="copy"/);
  assert.match(html, /<p class="project__summary"[^>]*\bdata-reveal="copy"/);
  assert.match(html, /<p class="project__lead"[^>]*\bdata-reveal="copy"/);
  assert.match(html, /<nav[\s\S]*class="project__links cluster"[\s\S]*\bdata-reveal="copy"/);
});

test("section intro renderer marks the composition boundary and copy targets", () => {
  const wrapped = renderSectionIntro({
    title: "Section",
    paragraphs: ["First", "Second"],
    bodyClassName: "custom-copy",
  });

  assert.match(wrapped, /<header class="section-copy flow"[^>]*\bdata-reveal-group/);
  assert.match(wrapped, /<h3 class="section-copy__title"[^>]*\bdata-reveal="copy"/);
  assert.match(wrapped, /<div class="section-copy__text custom-copy"[^>]*\bdata-reveal="copy"/);
  assert.equal(revealCount(wrapped), 2, "body wrapper should reveal once instead of each nested paragraph");

  const singleParagraphs = renderSectionIntro({
    title: "Section",
    paragraphs: ["First", "Second"],
  });

  assert.equal(revealCount(singleParagraphs), 3);
});

test("section intro renderer can opt out when nested inside a component-owned motion surface", () => {
  const html = renderSectionIntro(
    {
      title: "Nested",
      paragraphs: ["Copy"],
    },
    { reveal: false },
  );

  assertNoGlobalReveal(html, "nested section intro should not enter the global reveal system");
});

test("media figure renderer reveals static image surfaces and opts out videos and embedded decks", () => {
  const staticImage = renderMediaFigure({
    entryId: imageEntry,
    captionView: "summary",
  });

  assert.match(staticImage, /<figure[\s\S]*\bdata-reveal="media"/);

  const video = renderMediaFigure({
    entryId: videoEntry,
    captionView: "summary",
    surface: { ratio: "16 / 9" },
    video: {
      autoplay: true,
      loop: true,
      muted: true,
      playsInline: true,
      preload: "metadata",
      mimeType: "video/mp4",
    },
  });

  assertNoGlobalReveal(video, "video figures must not enter the global reveal system");

  const embeddedDeck = renderMediaFigure({
    entryId: imageEntry,
    captionView: "summary",
    surfaceDeck: {
      slides: [
        { entryId: imageEntry, loading: "lazy" },
        { entryId: secondImageEntry, loading: "lazy" },
      ],
    },
  });

  assertNoGlobalReveal(embeddedDeck, "embedded media decks own their own lifecycle");
});

test("media group renderer emits reveal groups from typed layout semantics", () => {
  const plain = renderMediaGroup({
    layout: "grid",
    captionView: "summary",
    items: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
  });

  assert.match(plain, /class="media-group__items"[^>]*\bdata-reveal-group/);
  assert.equal(revealCount(plain), 2);

  const masonry = renderMediaGroup({
    layout: "masonry",
    captionView: "summary",
    items: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
  });

  assert.match(masonry, /class="media-group__items"[^>]*\bdata-reveal-group/);
  assert.equal(revealCount(masonry), 2);

  const editorial = renderMediaGroup({
    layout: "editorial",
    captionView: "summary",
    items: [{ entryId: imageEntry, start: 1, span: 4 }, { entryId: secondImageEntry, role: "wide" }],
  });

  assert.match(editorial, /class="media-group__items"[^>]*\bdata-reveal-group/);
  assert.equal(revealCount(editorial), 2);
});

test("media group renderer excludes global reveal from always-owned rails and interactive strips", () => {
  const overflowReel = renderMediaGroup({
    layout: "grid",
    mode: "overflow-reel",
    captionView: "summary",
    items: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
  });

  assert.match(overflowReel, /class="media-group__items reel"[^>]*\bdata-reveal-rail/);
  assert.equal(revealCount(overflowReel), 0);

  const infiniteStrip = renderMediaGroup({
    layout: "strip",
    captionView: "summary",
    infiniteReel: { duration: "20s" },
    head: {
      credits: { title: "Credits" },
      note: { kind: "group", text: "Note" },
    },
    items: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
  });

  assertNoGlobalReveal(infiniteStrip, "infinite reel strips own their animation lifecycle");
});

test("responsive rails keep child reveal targets only when CSS can choose grid or rail", () => {
  const compactReel = renderMediaGroup({
    layout: "grid",
    mode: "compact-reel",
    captionView: "summary",
    items: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
  });

  assert.match(compactReel, /class="media-group__items reel"[^>]*\bdata-reveal-group[^>]*\bdata-reveal-rail/);
  assert.equal(revealCount(compactReel), 2);

  const bento = renderMediaGroup({
    layout: "bento",
    captionView: "summary",
    items: [{ entryId: imageEntry, colSpan: 2 }, { entryId: secondImageEntry }],
  });

  assert.match(bento, /class="media-group__items reel"[^>]*\bdata-reveal-group[^>]*\bdata-reveal-rail/);
  assert.equal(revealCount(bento), 2);
});

test("sequence middle reels are isolated from leading and trailing media reveals", () => {
  const html = renderMediaGroup({
    layout: "sequence",
    captionView: "summary",
    middleOverflow: "reel",
    leading: { entryId: imageEntry },
    middle: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
    trailing: { entryId: secondImageEntry },
  });

  assert.match(html, /class="media-group__items"[^>]*\bdata-reveal-group/);
  assert.match(html, /class="media-group__middle reel"[^>]*\bdata-reveal-group[^>]*\bdata-reveal-rail/);
  assert.equal(revealCount(html), 4);
});

test("justified gallery rows are independent reveal rails", () => {
  const html = renderJustifiedGallery({
    captionView: "overlay",
    rows: [
      {
        kind: "landscape",
        items: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
      },
    ],
  });

  assert.match(html, /class="justified-gallery__row reel"[^>]*\bdata-reveal-group[^>]*\bdata-reveal-rail/);
  assert.equal(revealCount(html), 2);
});

test("top-level interactive media components do not receive global reveal attributes", () => {
  assertNoGlobalReveal(
    renderMediaSlider({
      captionView: "summary",
      slides: [
        { entryId: imageEntry, captionView: "summary" },
        { entryId: secondImageEntry, captionView: "summary" },
      ],
    }),
    "media slider",
  );

  assertNoGlobalReveal(
    renderMockup({
      entryId: imageEntry,
      captionView: "summary",
      device: "desktop",
    }),
    "mockup",
  );

  assertNoGlobalReveal(
    renderMockupDeck({
      variant: "standard",
      captionView: "summary",
      device: "desktop",
      slides: [
        { entryId: imageEntry },
        { entryId: secondImageEntry },
      ],
    }),
    "mockup deck",
  );

  assertNoGlobalReveal(
    renderBeforeAfter({
      captionView: "summary",
      caption: { title: "Comparison" },
      before: { entryId: imageEntry, label: "Before" },
      after: { entryId: secondImageEntry, label: "After" },
    }),
    "before/after",
  );

  assertNoGlobalReveal(
    renderPageFlip({
      credits: { title: "Credits" },
      pages: [
        { entryId: imageEntry, index: "01" },
        { entryId: secondImageEntry, index: "02" },
      ],
    }),
    "page flip",
  );

  assertNoGlobalReveal(
    renderAnimatedCanvasGallery({
      profile: "production",
      ariaLabel: "Canvas gallery",
      sources: [{ entryId: imageEntry }],
    }),
    "animated canvas gallery",
  );
});
