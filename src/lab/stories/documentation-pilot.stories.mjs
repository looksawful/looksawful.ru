// PROTOTYPE: an isolated visual direction for the Storybook documentation shell.
// Compare with the existing canonical stories before approving any migration.
import "./documentation-pilot.css";
import { buildTokenRegistry, isCanonicalFoundationDeclaration } from "../token-visualization.mjs";
import { getVisibleProjectCardPresentations } from "../../data/projects.ts";
import { renderProjectCard } from "../../templates/project-card.ts";

const cards = getVisibleProjectCardPresentations();

function element(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined) node.textContent = textContent;
  return node;
}

function layout(title, description, classification) {
  const root = element("main", "lab-pilot");
  const frame = element("div", "lab-pilot__frame wrapper");
  frame.style.setProperty("--wrapper-max-width", "var(--content-wide-width)");
  const header = element("header", "lab-pilot__header");
  const trail = element("p", "lab-pilot__trail", classification);
  const headline = element("div", "lab-pilot__headline");
  headline.append(element("h1", "", title), element("p", "", description));
  header.append(trail, headline);
  frame.append(header);
  root.append(frame);
  return { root, frame };
}

function section(title, note) {
  const wrapper = element("section", "lab-pilot__section");
  const header = element("div", "lab-pilot__section-heading");
  header.append(element("h2", "", title), element("span", "", note));
  wrapper.append(header);
  return wrapper;
}

function sourceProperties() {
  const found = [];
  function visit(rules) {
    for (const rule of rules) {
      if (rule.style && isCanonicalFoundationDeclaration({ selector: rule.selectorText })) {
        for (const name of rule.style) {
          if (!/^--(?:ff|fw|fs|lh|ls)-/.test(name)) continue;
          const raw = rule.style.getPropertyValue(name).trim();
          if (raw) found.push({ name, raw, selector: rule.selectorText });
        }
      }
      try {
        if (rule.cssRules) visit(rule.cssRules);
      } catch {
        // A browser stylesheet may not expose nested rules.
      }
    }
  }
  for (const sheet of document.styleSheets) {
    try {
      if (sheet.cssRules) visit(sheet.cssRules);
    } catch {
      // Font/CDN sheets are not the local source of design tokens.
    }
  }
  return buildTokenRegistry(found).sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

function renderTypography() {
  const { root, frame } = layout(
    "типографика",
    "Шрифты, масштаб и ритм настоящего сайта. Все значения читаются из production CSS, а не из копии токенов.",
    "Foundations / Design tokens",
  );
  const tokens = sourceProperties();
  const stage = element("section", "lab-pilot__specimen");
  stage.setAttribute("aria-label", "Образец основного шрифта");
  stage.append(
    element("p", "lab-pilot__specimen-caption", "Inter Variable · основной шрифт"),
    element("div", "lab-pilot__giant-type", "Аа Бб 0123"),
    element("p", "lab-pilot__specimen-bottom", "Показатель ритма: настоящая типографика looksawful.ru"),
  );
  frame.append(stage);

  const categories = [
    { title: "Размеры", note: "font-size", names: /^--fs-/, example: "Аа Бб", property: "fontSize" },
    { title: "Гарнитуры", note: "font-family", names: /^--ff-/, example: "Аа Бб", property: "fontFamily" },
    { title: "Насыщенность", note: "font-weight", names: /^--fw-/, example: "Аа", property: "fontWeight" },
    { title: "Межстрочный ритм", note: "line-height", names: /^--lh-/, example: "Аа\nАа", property: "lineHeight" },
    { title: "Межбуквенный ритм", note: "letter-spacing", names: /^--ls-/, example: "Текст", property: "letterSpacing" },
  ];
  for (const category of categories) {
    const items = tokens.filter((token) => category.names.test(token.name));
    const block = section(category.title, category.note + " · " + items.length);
    const rows = element("div", "lab-pilot__token-list");
    for (const token of items) {
      const row = element("div", "lab-pilot__token-row");
      const name = element("code", "lab-pilot__token-name", token.name);
      const sample = element("span", "lab-pilot__token-sample", category.example);
      if (category.property === "fontSize") {
        sample.style.fontSize = "min(var(" + token.name + "), 3.5rem)";
      } else {
        sample.style[category.property] = "var(" + token.name + ")";
      }
      if (category.property === "lineHeight") sample.style.whiteSpace = "pre-line";
      const raw = element("code", "lab-pilot__token-value", token.raw);
      row.append(name, sample, raw);
      rows.append(row);
    }
    block.append(rows);
    frame.append(block);
  }
  const disclosure = element("details", "lab-pilot__details");
  disclosure.append(
    element("summary", "", "Источник значений и использование"),
    element("p", "", "Реестр читает глобальные объявления CSS и показывает их без дополнительной таблицы значений. Источник: src/styles/tokens.css."),
  );
  frame.append(disclosure);
  return root;
}

function renderProjectCardPilot(args) {
  const selected = cards.find((card) => card.id === args.projectId) ?? cards[0];
  const { root, frame } = layout(
    "project card",
    "Настоящая карточка проекта, извлечённая из портфолио. Стили, медиа, подписи и адреса принадлежат сайту.",
    "Molecules / Project card",
  );
  const stage = section("Демонстрация", "production renderer");
  stage.classList.add("lab-pilot__demo-section");
  const specimen = element("div", "lab-pilot__project-sample");
  const list = element("ul", "lab-pilot__project-list");
  list.innerHTML = renderProjectCard(selected);
  specimen.append(list);
  stage.append(specimen);
  frame.append(stage);

  const state = section("Состояния", "реальные взаимодействия");
  const states = element("div", "lab-pilot__states");
  states.append(
    element("span", "lab-pilot__state", "Default"),
    element("span", "lab-pilot__state", "Focus Visible"),
  );
  state.append(states);
  frame.append(state);

  const details = element("details", "lab-pilot__details");
  details.append(
    element("summary", "", "Использование и исходный код"),
    element("p", "", "Controls переключают существующие карточки. Содержимое берётся из реестра реальных проектов, не из фиктивных данных."),
  );
  const code = element("code", "lab-pilot__source", "src/templates/project-card.ts · renderProjectCard()");
  details.append(code);
  frame.append(details);
  return root;
}

export default {
  title: "90 Experimental/Documentation Pilot",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Isolated design prototype. Canonical Storybook stories are unchanged; approval is required before migration.",
      },
    },
  },
};

export const Typography = {
  render: renderTypography,
  parameters: {
    docs: { description: { story: "Live production type tokens in a shared editorial documentation shell." } },
  },
};

const projectControl = {
  projectId: {
    name: "Проект",
    control: { type: "select" },
    options: cards.map((card) => card.id),
  },
};

export const ProjectCard = {
  args: { projectId: cards[0].id },
  argTypes: projectControl,
  render: renderProjectCardPilot,
};

export const ProjectCardFocusVisible = {
  args: { projectId: cards[0].id },
  argTypes: projectControl,
  render: renderProjectCardPilot,
  play: ({ canvasElement }) => {
    const link = canvasElement.querySelector(".project-card");
    if (link instanceof HTMLAnchorElement) link.focus();
  },
};
