function collectCustomProperties() {
  const tokens = new Map();

  const visitRules = (rules) => {
    for (const rule of Array.from(rules)) {
      if (rule.style) {
        for (const property of Array.from(rule.style)) {
          if (!property.startsWith("--")) continue;
          const value = rule.style.getPropertyValue(property).trim();
          if (value) tokens.set(property, value);
        }
      }
      if (rule.cssRules) visitRules(rule.cssRules);
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.cssRules) visitRules(sheet.cssRules);
    } catch {
      // A stylesheet that cannot expose CSSOM is simply not part of the local token inventory.
    }
  }

  return [...tokens.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function tokenTable(filter) {
  const root = document.createElement("div");
  root.style.padding = "32px";
  root.style.background = "var(--clr-bg, #fff)";
  root.style.color = "var(--clr-text, #111)";
  root.style.minHeight = "100vh";

  const title = document.createElement("h1");
  title.textContent = "canonical CSS tokens";
  root.append(title);

  const note = document.createElement("p");
  note.textContent = "Values below are read from the loaded canonical site styles at runtime. Storybook does not own a duplicate token source.";
  root.append(note);

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  const body = document.createElement("tbody");

  for (const [name, rawValue] of collectCustomProperties().filter(([name]) => filter(name))) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const valueCell = document.createElement("td");
    const sampleCell = document.createElement("td");
    nameCell.textContent = name;
    valueCell.textContent = rawValue;
    nameCell.style.padding = valueCell.style.padding = sampleCell.style.padding = "8px";
    nameCell.style.borderBottom = valueCell.style.borderBottom = sampleCell.style.borderBottom = "1px solid var(--clr-border, #ddd)";
    if (name.startsWith("--clr-")) {
      const sample = document.createElement("span");
      sample.style.display = "block";
      sample.style.width = "48px";
      sample.style.height = "24px";
      sample.style.border = "1px solid currentColor";
      sample.style.background = `var(${name})`;
      sampleCell.append(sample);
    }
    row.append(nameCell, valueCell, sampleCell);
    body.append(row);
  }

  table.append(body);
  root.append(table);
  return root;
}

const meta = {
  title: "00 Foundations/Tokens",
  tags: ["autodocs", "stable"],
  parameters: {
    docs: {
      description: {
        component: "Live inventory of CSS custom properties from the canonical site stylesheet graph.",
      },
    },
  },
};

export default meta;

export const All = {
  render: () => tokenTable(() => true),
};

export const Colors = {
  render: () => tokenTable((name) => name.startsWith("--clr-")),
};

export const Typography = {
  render: () => tokenTable((name) => /(font|type|text|line|letter)/i.test(name)),
};

export const SpacingAndLayout = {
  render: () => tokenTable((name) => /(space|gap|radius|width|container|grid|size)/i.test(name)),
};

export const Motion = {
  render: () => tokenTable((name) => /(motion|duration|ease|transition)/i.test(name)),
};
