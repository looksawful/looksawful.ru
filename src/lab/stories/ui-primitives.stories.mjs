function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, variant = "secondary", size = "md", attributes = {}) {
  const node = element("button", "control", label);
  node.type = "button";
  node.dataset.variant = variant;
  node.dataset.size = size;
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) node.setAttribute(name, "");
    else node.setAttribute(name, value);
  }
  return node;
}

function section(title) {
  const root = element("section", "panel stack");
  root.dataset.level = "raised";
  root.append(element("h2", "", title));
  return root;
}

function renderControls() {
  const root = section("controls");
  const variants = element("div", "cluster");
  variants.append(
    button("Primary", "primary"),
    button("Secondary"),
    button("Quiet", "quiet"),
    button("Danger", "danger"),
  );
  const sizes = element("div", "cluster");
  sizes.append(
    button("Small", "secondary", "sm"),
    button("Medium"),
    button("Large", "secondary", "lg"),
  );
  const states = element("div", "cluster");
  states.append(
    button("Pressed", "secondary", "md", { "aria-pressed": "true" }),
    button("Disabled", "secondary", "md", { disabled: true }),
  );
  const icon = button("×", "quiet", "md", { "aria-label": "Close" });
  icon.dataset.shape = "round";
  states.append(icon);
  root.append(variants, sizes, states);
  return root;
}

function renderChipsAndBadges() {
  const root = section("chips & badges");
  const chips = element("div", "cluster");
  const neutral = element("button", "chip", "Neutral");
  neutral.type = "button";
  neutral.setAttribute("aria-pressed", "false");
  const selected = element("button", "chip", "Selected");
  selected.type = "button";
  selected.setAttribute("aria-pressed", "true");
  const disabled = element("button", "chip", "Disabled");
  disabled.type = "button";
  disabled.disabled = true;
  chips.append(neutral, selected, disabled);

  const badges = element("div", "cluster");
  badges.append(
    element("span", "badge", "Case study"),
    element("span", "badge", "2026"),
    element("span", "badge", "UI / UX"),
  );
  root.append(chips, badges);
  return root;
}

function renderPanels() {
  const root = section("panels");
  for (const level of ["plain", "raised", "elevated"]) {
    const panel = element("article", "panel stack");
    panel.dataset.level = level;
    panel.append(element("strong", "", level), element("p", "", "Surface content"));
    root.append(panel);
  }
  return root;
}
function renderOverview() {
  const root = element("main", "wrapper stack");
  root.append(
    element("h1", "", "UI primitives"),
    renderControls(),
    renderChipsAndBadges(),
    renderPanels(),
  );
  return root;
}

const meta = {
  title: "01 Atoms/UI Primitives",
  tags: ["autodocs", "stable"],
  render: renderOverview,
  parameters: {
    layout: "padded",
    looksawful: {
      sources: ["src/styles/primitives.css"],
      layer: "atom",
      policy: "isolated",
      canonical: true,
      state: "variant-states",
      visibility: ["always"],
      interaction: [
        "default",
        "hover",
        "focus-visible",
        "active-or-pressed",
        "selected",
        "disabled",
      ],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
        conditions: ["(hover: hover) and (pointer: fine)", "(pointer: coarse)"],
      },
    },
    docs: {
      description: {
        component: "Production-backed controls, chips, badges and panel surfaces using the canonical site CSS.",
      },
    },
  },
};

export default meta;

export const Overview = {};

export const Controls = {
  render: renderControls,
};

export const ChipsAndBadges = {
  render: renderChipsAndBadges,
};

export const Panels = {
  render: renderPanels,
};

export const FocusVisible = {
  render: () => button("Keyboard focus"),
  play: ({ canvasElement }) => {
    const control = canvasElement.querySelector(".control");
    if (control instanceof HTMLButtonElement) control.focus();
  },
  parameters: {
    looksawful: {
      state: "focus-visible",
      interaction: ["focus-visible"],
    },
  },
};

export const SelectedAndDisabled = {
  render: () => {
    const root = element("div", "cluster");
    const selected = element("button", "chip", "Selected");
    selected.type = "button";
    selected.setAttribute("aria-pressed", "true");
    const disabled = button("Disabled", "secondary", "md", { disabled: true });
    root.append(selected, disabled);
    return root;
  },
};
