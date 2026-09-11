import { projects } from "../../data/catalog/projects/index.ts";
import { mediaCatalogItems } from "../../data/media/catalog-view.ts";
import { mediaEntries } from "../../data/media/entries/index.ts";
import {
  buildMediaDeskInventoryIndex,
  filterMediaDeskInventoryRecords,
  summarizeMediaDeskDiagnostics,
  type MediaDeskInventoryDiagnosticFilter,
  type MediaDeskInventoryRecord,
  type MediaDeskInventoryUsageFilter,
} from "./inventory-model.ts";
import "./inventory-readonly.css";

const records = buildMediaDeskInventoryIndex(mediaCatalogItems, mediaEntries);
const summary = summarizeMediaDeskDiagnostics(records);
const projectNames = new Map(projects.map((project) => [project.id, project.name] as const));

const diagnosticLabels: Record<Exclude<MediaDeskInventoryDiagnosticFilter, "all">, string> = {
  orphan: "orphan",
  "missing-source": "missing source",
  "duplicate-id": "duplicate id",
  "duplicate-path": "duplicate path",
};

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function option(value: string, label: string): HTMLOptionElement {
  const node = element("option");
  node.value = value;
  node.textContent = label;
  return node;
}

function valueOrDash(value: string | undefined): string {
  return value?.trim() || "—";
}

function projectLabels(ids: readonly string[]): string {
  return ids.map((id) => projectNames.get(id) ?? id).join(" · ") || "—";
}

function dimensions(record: MediaDeskInventoryRecord): string {
  const width = record.item.asset.width;
  const height = record.item.asset.height;
  if (!width || !height) return "—";
  return `${width} × ${height} · ${(width / height).toFixed(3)}`;
}

function row(label: string, value: string): HTMLDivElement {
  const node = element("div", "md-inventory-row");
  node.append(
    element("dt", "md-inventory-row__label", label),
    element("dd", "md-inventory-row__value", value),
  );
  return node;
}

function group(label: string, rows: readonly HTMLDivElement[]): HTMLElement {
  const section = element("section", "md-inventory-group");
  const heading = element("h4", "md-inventory-group__title", label);
  const list = element("dl", "md-inventory-group__list");
  list.append(...rows);
  section.append(heading, list);
  return section;
}

function showInGallery(record: MediaDeskInventoryRecord): void {
  const search = document.querySelector<HTMLInputElement>(".md-search");
  if (!search) return;

  search.value = record.assetId;
  search.dispatchEvent(new Event("input", { bubbles: true }));

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const card = document.querySelector<HTMLElement>(
        `.md-card[data-asset-id="${CSS.escape(record.assetId)}"]`,
      );
      if (!card) return;
      card.click();
      card.focus({ preventScroll: true });
      card.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  });
}

function recordCard(record: MediaDeskInventoryRecord): HTMLElement {
  const card = element("article", "md-inventory-card");
  const header = element("header", "md-inventory-card__header");
  const titleWrap = element("div", "md-inventory-card__title-wrap");
  titleWrap.append(
    element("strong", "md-inventory-card__title", record.item.title || record.assetId),
    element("code", "md-inventory-card__id", record.assetId),
  );

  const showButton = element("button", "md-button md-inventory-card__show", "Показать");
  showButton.type = "button";
  showButton.addEventListener("click", () => showInGallery(record));
  header.append(titleWrap, showButton);

  const badges = element("div", "md-inventory-badges");
  badges.append(
    element("span", "md-inventory-badge", `canonical · ${record.item.origin}`),
    element("span", "md-inventory-badge", `placement · ${record.usage.total}`),
  );
  for (const diagnostic of record.diagnostics) {
    badges.append(
      element("span", "md-inventory-badge md-inventory-badge--diagnostic", `derived · ${diagnosticLabels[diagnostic]}`),
    );
  }

  const masterSource = record.item.asset.type === "video"
    ? valueOrDash(record.item.asset.sourceSrc)
    : "—";

  const canonical = group("Canonical metadata", [
    row("Origin", record.item.origin),
    row("Type", record.item.asset.type),
    row("Delivery/source path", valueOrDash(record.item.asset.src)),
    row("Master path", masterSource),
    row("Dimensions / ratio", dimensions(record)),
    row("MIME", valueOrDash(record.item.mimeType)),
    row("Alt", valueOrDash(record.item.alt)),
    row("Caption", valueOrDash(record.item.description)),
    row("Projects", projectLabels(record.item.projectIds)),
  ]);

  const placement = group("Placement metadata", [
    row("Direct uses", String(record.usage.direct)),
    row("Poster uses", String(record.usage.poster)),
    row("Entry IDs", record.usage.entryIds.join(" · ") || "—"),
    row("Placement projects", projectLabels(record.usage.projectIds)),
  ]);

  const derived = group("Derived diagnostics", [
    row(
      "State",
      record.diagnostics.length > 0
        ? record.diagnostics.map((diagnostic) => diagnosticLabels[diagnostic]).join(" · ")
        : "clean",
    ),
  ]);

  card.append(header, badges, canonical, placement, derived);
  return card;
}

function mount(): void {
  const status = document.querySelector<HTMLElement>(".md-status");
  if (!status || document.querySelector(".md-inventory")) return;

  const panel = element("details", "md-inventory");
  const summaryNode = element("summary", "md-inventory__summary");
  summaryNode.append(
    element("strong", undefined, "Inventory diagnostics"),
    element(
      "span",
      "md-inventory__summary-counts",
      `${records.length} assets · ${summary.orphan} orphan · ${summary["missing-source"]} missing source · ${summary["duplicate-path"]} duplicate path`,
    ),
  );

  const body = element("div", "md-inventory__body");
  const controls = element("div", "md-inventory-controls");

  const search = element("input", "md-control md-inventory-search");
  search.type = "search";
  search.placeholder = "ID, path, placement, caption…";
  search.setAttribute("aria-label", "Поиск по inventory metadata");

  const usage = element("select", "md-control");
  usage.setAttribute("aria-label", "Фильтр использования");
  usage.append(
    option("all", "Все usage"),
    option("used", "Используется"),
    option("orphan", "Orphan"),
  );

  const diagnostic = element("select", "md-control");
  diagnostic.setAttribute("aria-label", "Фильтр diagnostics");
  diagnostic.append(
    option("all", "Все diagnostics"),
    option("orphan", "Orphan"),
    option("missing-source", "Missing source"),
    option("duplicate-id", "Duplicate ID"),
    option("duplicate-path", "Duplicate path"),
  );

  const resultMeta = element("span", "md-inventory-controls__meta");
  controls.append(search, usage, diagnostic, resultMeta);

  const list = element("div", "md-inventory-list");
  list.setAttribute("aria-live", "polite");

  const render = (): void => {
    const filtered = filterMediaDeskInventoryRecords(records, {
      search: search.value,
      usage: usage.value as MediaDeskInventoryUsageFilter,
      diagnostic: diagnostic.value as MediaDeskInventoryDiagnosticFilter,
    });
    const visible = filtered.slice(0, 120);
    resultMeta.textContent = filtered.length > visible.length
      ? `${visible.length} / ${filtered.length}`
      : String(filtered.length);
    list.replaceChildren(...visible.map(recordCard));
    if (visible.length === 0) {
      list.append(element("p", "md-inventory-empty", "Совпадений нет"));
    }
  };

  search.addEventListener("input", render);
  usage.addEventListener("change", render);
  diagnostic.addEventListener("change", render);

  body.append(controls, list);
  panel.append(summaryNode, body);
  status.insertAdjacentElement("afterend", panel);
  render();
}

mount();
