from __future__ import annotations

from collections import defaultdict
from html import escape, unescape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
CAPTIONS_JS = ROOT / "src/content/media-captions.js"
PRESENTATION_JS = ROOT / "src/content/accordion-presentation.js"
PRESENTATION_CSS = ROOT / "src/content/accordion-presentation.css"
UTILITIES_CSS = ROOT / "src/styles/utilities.css"

PROJECT_PREFIXES = (
    ("jestei-", "Jestei Pool"),
    ("styx-", "Styx Jewels"),
    ("shootings-", "Shootings"),
    ("sands-", "S&S"),
    ("sensetique-", "Sensetique"),
)

FIGURE_RE = re.compile(r"<figure\b(?P<attrs>[^>]*)>(?P<body>.*?)</figure>", re.S)
FIGCAPTION_RE = re.compile(r"\s*<figcaption\b[^>]*>.*?</figcaption>", re.S)
MEDIA_ID_RE = re.compile(r'data-media-id="([^"]+)"')
TAG_RE = re.compile(r"<[^>]+>")

CREDIT_MARKER_RE = re.compile(
    r",\s*(?=(?:продюсер|фотограф(?:ия)?|стилист|лейбл|дизайн|художник(?:\s+по\s+свету)?|режисс[её]р)\b)",
    re.I,
)
CREDIT_SENTENCE_RE = re.compile(
    r"(?<=\.)\s+(?=(?:Фотограф|Продюсер|Стилист|Лейбл|Дизайн|Художник|Режисс[её]р)\b)"
)
YEAR_META_RE = re.compile(r"\s/\s\d{4}\.?$")


def project_for(media_id: str) -> str | None:
    for prefix, project in PROJECT_PREFIXES:
        if media_id.startswith(prefix):
            return project
    return None


def read_caption_map() -> dict[str, str]:
    mapping: dict[str, str] = {}
    entry_re = re.compile(
        r'^\s*"([^"]+)"\s*:\s*("(?:\\.|[^"\\])*")\s*,?\s*$'
    )
    for line in CAPTIONS_JS.read_text(encoding="utf-8").splitlines():
        match = entry_re.match(line)
        if match:
            mapping[match.group(1)] = json.loads(match.group(2))
    if not mapping:
        raise RuntimeError("No captions parsed from media-captions.js")
    return mapping


def split_caption(text: str) -> tuple[str, str, str]:
    """Split without changing a single source character."""
    meta_starts: list[int] = []
    for pattern in (CREDIT_MARKER_RE, CREDIT_SENTENCE_RE, YEAR_META_RE):
        match = pattern.search(text)
        if match:
            meta_starts.append(match.start())

    meta_start = min(meta_starts) if meta_starts else len(text)
    before_meta = text[:meta_start]

    sentence = re.search(r"[.!?](?=\s|$)", before_meta)
    if sentence:
        title_end = sentence.end()
    else:
        title_end = len(before_meta)

    title = text[:title_end]
    body = text[title_end:meta_start]
    meta = text[meta_start:]

    if title + body + meta != text:
        raise AssertionError("Caption segmentation changed source text")
    return title, body, meta


def caption_line(media_id: str, number: str, text: str) -> str:
    title, body, meta = split_caption(text)
    bits = [
        f'<span class="media-caption__index">{number}</span> ',
        f'<span class="media-caption__title">{escape(title, quote=False)}</span>',
    ]
    if body:
        bits.append(
            f'<span class="media-caption__text">{escape(body, quote=False)}</span>'
        )
    if meta:
        bits.append(
            f'<span class="media-caption__meta">{escape(meta, quote=False)}</span>'
        )
    return (
        f'<p class="media-caption__line" data-media-caption-for="{media_id}">'
        + "".join(bits)
        + "</p>"
    )


def visible_caption_for_figure(block: str, media_ids: list[str]) -> bool:
    if len(media_ids) != 1:
        return False
    hidden_component_tokens = (
        "data-media-slider",
        "media-strip-slider",
        "data-media-marquee",
        "data-infinite-reel",
    )
    return not any(token in block for token in hidden_component_tokens)


def migrate_index(mapping: dict[str, str]) -> tuple[str, dict[str, int]]:
    source = INDEX.read_text(encoding="utf-8")

    present_ids: list[str] = []
    seen: set[str] = set()
    for match in MEDIA_ID_RE.finditer(source):
        media_id = match.group(1)
        if media_id in mapping and media_id not in seen:
            seen.add(media_id)
            present_ids.append(media_id)

    counters: defaultdict[str, int] = defaultdict(int)
    numbers: dict[str, str] = {}
    for media_id in present_ids:
        project = project_for(media_id)
        if not project:
            raise RuntimeError(f"Unknown project for {media_id}")
        counters[project] += 1
        numbers[media_id] = f"{counters[project]:02d}"

    processed: set[str] = set()
    visible_count = 0
    hidden_count = 0

    def replace_figure(match: re.Match[str]) -> str:
        nonlocal visible_count, hidden_count
        attrs = match.group("attrs")
        body = match.group("body")
        block = match.group(0)

        ids: list[str] = []
        for media_id in MEDIA_ID_RE.findall(block):
            if media_id in mapping and media_id not in ids:
                ids.append(media_id)
        if not ids:
            return block

        for media_id in ids:
            processed.add(media_id)

        clean_body = FIGCAPTION_RE.sub("", body).rstrip()
        line_start = source.rfind("\n", 0, match.start()) + 1
        indent = source[line_start:match.start()]
        if not indent.isspace() and indent:
            indent = ""
        child_indent = indent + "  "

        is_visible = visible_caption_for_figure(block, ids)
        if len(ids) == 1:
            media_id = ids[0]
            hidden_attr = "" if is_visible else " hidden"
            caption = (
                f'\n{child_indent}<figcaption class="media-item__caption media-caption prose" '
                f'data-media-caption="" data-media-caption-for="{media_id}"{hidden_attr}>'
                f'{caption_line(media_id, numbers[media_id], mapping[media_id])}'
                f'</figcaption>\n{indent}'
            )
            visible_count += int(is_visible)
            hidden_count += int(not is_visible)
        else:
            entries = "".join(
                caption_line(media_id, numbers[media_id], mapping[media_id])
                for media_id in ids
            )
            caption = (
                f'\n{child_indent}<figcaption class="media-item__captions media-caption-list prose" '
                f'data-media-captions="" hidden>{entries}</figcaption>\n{indent}'
            )
            hidden_count += len(ids)

        return f"<figure{attrs}>{clean_body}{caption}</figure>"

    migrated = FIGURE_RE.sub(replace_figure, source)

    missing = set(present_ids) - processed
    if missing:
        raise RuntimeError(
            "Captioned media outside <figure>: " + ", ".join(sorted(missing))
        )

    # Verify every source caption survived character-for-character after the number.
    for media_id in present_ids:
        entry_re = re.compile(
            rf'<p class="media-caption__line" data-media-caption-for="{re.escape(media_id)}">(.*?)</p>',
            re.S,
        )
        entry = entry_re.search(migrated)
        if not entry:
            raise RuntimeError(f"Missing generated caption markup for {media_id}")
        rendered = unescape(TAG_RE.sub("", entry.group(1)))
        expected_prefix = numbers[media_id] + " "
        if not rendered.startswith(expected_prefix):
            raise RuntimeError(f"Missing static number for {media_id}")
        if rendered[len(expected_prefix):] != mapping[media_id]:
            raise RuntimeError(f"Caption text changed for {media_id}")

    stats = {
        "mapped": len(mapping),
        "present": len(present_ids),
        "visible": visible_count,
        "hidden_component_entries": hidden_count,
    }
    return migrated, stats


GEOMETRY_BLOCK = r'''function moveSliderAttributes(figure, surface) {
  [...figure.attributes]
    .filter(({ name }) => name.startsWith("data-media-slider"))
    .forEach(({ name, value }) => {
      surface.setAttribute(name, value);
      figure.removeAttribute(name);
    });
}

function ensureSliderSurface(figure, assets) {
  const existing = figure.querySelector(
    ":scope > [data-media-caption-surface][data-media-slider]",
  );

  if (existing instanceof HTMLElement) return existing;

  const surface = document.createElement("div");
  surface.className = "media-item__surface";
  surface.dataset.mediaCaptionSurface = "";

  const ratio = inferredAspectRatio(figure, assets[0]);
  if (ratio) surface.style.aspectRatio = ratio;

  moveSliderAttributes(figure, surface);
  assets[0].before(surface);
  assets.forEach((asset) => surface.append(mediaUnitFor(asset)));
  return surface;
}

function ensureMediaSurface(figure, asset) {
  const unit = mediaUnitFor(asset);
  const directChild = directFigureChild(figure, unit);

  if (!(directChild instanceof HTMLElement)) return null;

  const ratio = inferredAspectRatio(figure, asset);

  if (directChild !== unit) {
    directChild.dataset.mediaCaptionSurface = "";
    if (ratio && getComputedStyle(directChild).aspectRatio === "auto") {
      directChild.style.aspectRatio = ratio;
    }
    return directChild;
  }

  const surface = document.createElement("div");
  surface.className = "media-item__surface";
  surface.dataset.mediaCaptionSurface = "";
  if (ratio) surface.style.aspectRatio = ratio;

  directChild.replaceWith(surface);
  surface.append(directChild);
  return surface;
}

function directStaticCaption(figure) {
  return figure.querySelector(
    ":scope > :is(figcaption[data-media-caption], figcaption[data-media-captions])",
  );
}

function prepareSliderFigure(figure, assets) {
  ensureSliderSurface(figure, assets);
  figure.dataset.mediaCaptioned = "";
}

function prepareSingleMediaFigure(figure, asset) {
  const surface = ensureMediaSurface(figure, asset);
  if (!(surface instanceof HTMLElement)) return;

  figure.dataset.mediaCaptioned = "";
  const caption = directStaticCaption(figure);
  if (caption instanceof HTMLElement && caption.previousElementSibling !== surface) {
    surface.after(caption);
  }
}

function assetsInFigure(figure) {
  return [...figure.querySelectorAll(":is(img, video)[data-media-id]")];
}

function prepareMediaFigure(figure) {
  if (!(directStaticCaption(figure) instanceof HTMLElement)) return;

  const assets = assetsInFigure(figure);
  if (assets.length === 0) return;

  const slider =
    figure.hasAttribute("data-media-slider") ||
    figure.querySelector(":scope > [data-media-slider]");

  if (slider && assets.length > 1) {
    prepareSliderFigure(figure, assets);
    return;
  }

  prepareSingleMediaFigure(figure, assets[0]);
}

function prepareStaticMediaLayout(scope) {
  if (!(scope instanceof Document || scope instanceof HTMLElement)) return;

  const figures = new Set();
  if (scope instanceof HTMLElement) {
    const ownFigure = scope.closest(".cv-item figure");
    if (ownFigure instanceof HTMLElement && directStaticCaption(ownFigure)) {
      figures.add(ownFigure);
    }
  }

  scope.querySelectorAll(".cv-item figure").forEach((figure) => {
    if (directStaticCaption(figure)) figures.add(figure);
  });

  figures.forEach(prepareMediaFigure);
}'''

EXPORT_BLOCK = r'''export function applyAccordionPresentation(root = document) {
  root.querySelectorAll(".cv-item[data-cv-scene]").forEach(prepareScene);
  hideDetailPanel(root);
  prepareStaticMediaLayout(root);

  const observer =
    typeof MutationObserver === "function"
      ? new MutationObserver((records) => {
          records.forEach((record) => {
            record.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) prepareStaticMediaLayout(node);
            });
          });
        })
      : null;

  observer?.observe(root === document ? document.documentElement : root, {
    childList: true,
    subtree: true,
  });

  return () => observer?.disconnect();
}
'''


def migrate_presentation_js() -> str:
    js = PRESENTATION_JS.read_text(encoding="utf-8")
    js = re.sub(
        r'^import \{ MEDIA_CAPTIONS \} from "\.\/media-captions\.js";\n\n',
        "",
        js,
        count=1,
    )
    start = js.index("function ensureCaption(")
    end = js.index("function prepareScene(", start)
    js = js[:start] + GEOMETRY_BLOCK + "\n\n" + js[end:]
    export_start = js.index("export function applyAccordionPresentation")
    js = js[:export_start] + EXPORT_BLOCK

    forbidden = ("MEDIA_CAPTIONS", "setCaption(", "updateSliderCaption", "applyMediaCaptions")
    for token in forbidden:
        if token in js:
            raise RuntimeError(f"Caption runtime token still present: {token}")
    return js


CAPTION_CSS = r'''  .cv-item [data-media-captioned] {
    display: grid;
    grid-template-rows: auto auto;
    align-content: start;
    gap: var(--media-item-caption-gap, 0.5rem);
    aspect-ratio: auto !important;
    overflow: visible;
    background: transparent;
  }

  .cv-item [data-media-caption-surface] {
    min-inline-size: 0;
    min-block-size: 0;
    inline-size: 100%;
    overflow: hidden;
    background: var(
      --media-gallery-item-background,
      color-mix(in srgb, currentColor, transparent 92%)
    );
  }

  .cv-item [data-media-caption-surface] > :is(img, video, picture),
  .cv-item [data-media-caption-surface] > picture > img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  .cv-item [data-media-caption-surface] > :is(img, video),
  .cv-item [data-media-caption-surface] > picture > img {
    object-fit: var(--media-gallery-object-fit, cover);
    object-position: var(--media-gallery-object-position, 50% 50%);
  }

  .cv-item
    [data-media-captioned][data-media-fit="contain"]
    [data-media-caption-surface]
    > :is(img, video),
  .cv-item
    [data-media-captioned][data-media-fit="contain"]
    [data-media-caption-surface]
    > picture
    > img {
    object-fit: contain;
  }

  .cv-item [data-media-captioned]
    > :is(figcaption[data-media-caption], figcaption[data-media-captions]) {
    display: block !important;
    position: static !important;
    inset: auto !important;
    inline-size: 100%;
    min-inline-size: 0;
    max-inline-size: none;
    margin: 0;
    padding: 0;
    background: transparent !important;
    opacity: 1 !important;
    visibility: visible !important;
    font-family: var(--font-primary);
    font-size: clamp(1rem, 0.9375rem + 0.2cqi, 1.0625rem);
    font-weight: var(--font-weight-regular);
    font-style: normal;
    line-height: 1.45;
    color: var(--item-text);
  }

  .cv-item [data-media-captioned]
    > :is(figcaption[data-media-caption], figcaption[data-media-captions])[hidden] {
    display: none !important;
  }

  .media-caption,
  .media-caption-list {
    --prose-space: 0;
  }

  .media-caption__line {
    margin: 0;
  }

  .media-caption__index,
  .media-caption__title,
  .media-caption__text,
  .media-caption__meta {
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    font-style: normal;
    line-height: inherit;
    letter-spacing: inherit;
  }

  .media-caption__index,
  .media-caption__text,
  .media-caption__meta {
    font-weight: var(--font-weight-regular);
  }

  .media-caption__index {
    margin-inline-end: 0.28em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .media-caption__title {
    font-weight: var(--font-weight-semibold);
  }
'''


def migrate_presentation_css() -> str:
    css = PRESENTATION_CSS.read_text(encoding="utf-8")
    start = css.index("  .cv-item [data-media-captioned] {")
    layer_close = css.rfind("}\n")
    if layer_close < start:
        raise RuntimeError("Could not locate accordion presentation layer close")
    css = css[:start] + CAPTION_CSS + "}\n"
    if "max-inline-size: 72ch" in css:
        raise RuntimeError("Old caption measure survived migration")
    return css


UTILITY_BLOCK = r'''

/* Two-child source/visual order utility. Parent must already be grid or flex. */
.swap-order > :first-child {
  order: 2;
}

.swap-order > :last-child {
  order: 1;
}

/* Opt-in split that uses the existing split columns from the mobile size up. */
.split-always {
  grid-template-columns: var(
    --split-columns,
    minmax(0, 1fr) minmax(0, 1fr)
  );
}
'''


def migrate_utilities() -> str:
    css = UTILITIES_CSS.read_text(encoding="utf-8").rstrip() + "\n"
    if ".swap-order > :first-child" not in css:
        css += UTILITY_BLOCK
    return css


def main() -> None:
    mapping = read_caption_map()
    migrated_index, stats = migrate_index(mapping)
    INDEX.write_text(migrated_index, encoding="utf-8")
    PRESENTATION_JS.write_text(migrate_presentation_js(), encoding="utf-8")
    PRESENTATION_CSS.write_text(migrate_presentation_css(), encoding="utf-8")
    UTILITIES_CSS.write_text(migrate_utilities(), encoding="utf-8")
    CAPTIONS_JS.unlink()

    if 'from "./media-captions.js"' in PRESENTATION_JS.read_text(encoding="utf-8"):
        raise RuntimeError("media-captions import survived")

    print(json.dumps(stats, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
