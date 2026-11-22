import "../storybook/project-theme-presets.css";

const themeNames = [
  "neutral",
  "pink-red",
  "red-pink",
  "blue-pink",
  "lavender-brown",
  "purple-lime",
  "warm-red",
  "lime-black",
  "acid-violet",
  "berry-pink",
  "mint-green",
  "electric-ice",
  "black-acid",
  "orange-cream",
  "black-white",
  "black-green",
  "soft-pink",
  "blue",
  "lavender",
  "orange-black",
  "white-red",
  "white-blue",
  "black-red",
  "black-orange"
];
const colorRoles = ["surface", "foreground", "accent", "on-accent"];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createChoice(theme) {
  const button = element("button", "theme-catalog__choice");
  button.type = "button";
  button.dataset.preset = theme;
  button.setAttribute("aria-pressed", "false");
  const swatches = element("span", "theme-catalog__swatches");
  swatches.dataset.theme = theme;
  swatches.setAttribute("aria-hidden", "true");
  for (const role of colorRoles) {
    const swatch = element("span");
    swatch.style.background = "var(--clr-" + role + ")";
    swatches.append(swatch);
  }
  button.append(swatches, element("span", "theme-catalog__name", theme.replaceAll("-", " ")));
  return button;
}

function renderThemeCatalog() {
  const root = element("main", "theme-catalog");
  root.append(
    element("h1", "", "Project theme presets"),
    element("p", "theme-catalog__description", "Second-level color systems for project presentations. The 24 preserved presets can be previewed here, but are not enabled on the live portfolio."),
  );
  const stage = element("section", "theme-catalog__stage");
  stage.setAttribute("aria-label", "Selected theme preview");
  const copy = element("div", "theme-catalog__stage-copy");
  const title = element("h2");
  copy.append(title, element("p", "", "Surface and foreground are inherited by content. Accent and on-accent are paired on the sample panel."));
  stage.append(copy, element("div", "theme-catalog__accent", "accent / on-accent"));
  root.append(stage, element("p", "theme-catalog__legend", "Swatches: surface · foreground · accent · on-accent"));
  const grid = element("div", "theme-catalog__grid");
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", "Select a project color theme");
  const choices = themeNames.map(createChoice);
  for (const choice of choices) grid.append(choice);
  const selectTheme = (name) => {
    stage.dataset.theme = name;
    title.textContent = name.replaceAll("-", " ");
    for (const choice of choices) choice.setAttribute("aria-pressed", String(choice.dataset.preset === name));
  };
  grid.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button[data-preset]") : null;
    if (button && grid.contains(button)) selectTheme(button.dataset.preset);
  });
  selectTheme("neutral");
  root.append(grid);
  return root;
}

export default {
  title: "00 Foundations/Design Tokens/Project Themes",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "Twenty-four preserved, nested project palettes, imported only in Storybook. The public portfolio uses neutral foundation colors." } },
  },
};

export const AllPresets = { render: renderThemeCatalog };
