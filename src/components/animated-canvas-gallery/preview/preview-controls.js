const GROUP_LABELS = Object.freeze({
  state: "состояние",
  motion: "движение",
  interaction: "взаимодействие",
  scroll: "скролл",
  sequential: "последовательность",
  geometry: "геометрия",
  cards: "карточки",
  title: "текст",
  effects: "эффекты",
  performance: "производительность",
  columns: "колонки",
  fade: "затухание",
  layout: "раскладка",
  tiles: "плитки",
});

const GROUP_ORDER = Object.keys(GROUP_LABELS);

function serialize(value) {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  if (value == null) {
    return "";
  }

  return String(value);
}

function createInput(field) {
  if (field.control === "select") {
    const select = document.createElement("select");

    for (const optionValue of field.options || []) {
      const option = document.createElement("option");
      option.value = String(optionValue);
      option.textContent = String(optionValue);
      select.append(option);
    }

    return select;
  }

  const input = document.createElement("input");

  input.type =
    field.control === "checkbox"
      ? "checkbox"
      : field.control === "range"
        ? "range"
        : field.control === "number"
          ? "number"
          : "text";

  if (field.min != null) {
    input.min = String(field.min);
  }

  if (field.max != null) {
    input.max = String(field.max);
  }

  if (field.step != null) {
    input.step = String(field.step);
  }

  return input;
}

function ensureDefaults(root, fields) {
  for (const field of fields) {
    if (!root.hasAttribute(field.attr)) {
      root.setAttribute(
        field.attr,
        serialize(field.defaultValue),
      );
    }
  }
}

function matchesVisibility(
  root,
  fieldsByName,
  visibleWhen,
) {
  if (!visibleWhen) {
    return true;
  }

  return Object.entries(visibleWhen).every(
    ([name, expected]) => {
      const field = fieldsByName.get(name);

      if (!field) {
        return true;
      }

      const raw =
        root.getAttribute(field.attr) ??
        serialize(field.defaultValue);

      if (typeof expected === "boolean") {
        return (raw === "true" || raw === "") === expected;
      }

      return raw === String(expected);
    },
  );
}

export function createPresetSnapshot({
  root,
  fields,
  variant,
}) {
  const attributes = {
    "data-gallery-variant": variant,
    "data-gallery-preset":
      root.getAttribute("data-gallery-preset") || "embedded",
    "data-gallery-source":
      root.getAttribute("data-gallery-source") || "",
  };

  for (const field of fields) {
    attributes[field.attr] =
      root.getAttribute(field.attr) ??
      serialize(field.defaultValue);
  }

  return {
    version: 1,
    component: "animated-canvas-gallery",
    attributes,
  };
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Continue with the textarea fallback below when Clipboard API is denied.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
}

export function createAnimatedCanvasGalleryControls({
  root,
  fields,
  variant,
}) {
  ensureDefaults(root, fields);

  const panel = document.createElement("div");
  panel.className =
    "animated-canvas-gallery-controls";

  const header = document.createElement("header");
  header.className =
    "animated-canvas-gallery-controls__header";

  const heading = document.createElement("p");
  heading.className =
    "animated-canvas-gallery-controls__heading";
  heading.textContent = variant;

  const copyButton = document.createElement("button");
  copyButton.className =
    "animated-canvas-gallery-controls__copy";
  copyButton.type = "button";
  copyButton.textContent = "копировать пресет";

  header.append(heading, copyButton);
  panel.append(header);

  const fieldsByName = new Map(
    fields.map((field) => [field.name, field]),
  );

  const controls = new Map();
  const grouped = new Map();

  for (const field of fields) {
    if (!grouped.has(field.group)) {
      grouped.set(field.group, []);
    }

    grouped.get(field.group).push(field);
  }

  for (const groupName of GROUP_ORDER) {
    const groupFields = grouped.get(groupName);

    if (!groupFields?.length) {
      continue;
    }

    const details = document.createElement("details");
    details.className =
      "animated-canvas-gallery-controls__group";

    if (groupName === "state") {
      details.open = true;
    }

    const summary = document.createElement("summary");
    summary.textContent =
      GROUP_LABELS[groupName] || groupName;

    const grid = document.createElement("div");
    grid.className =
      "animated-canvas-gallery-controls__grid";

    details.append(summary, grid);

    for (const field of groupFields) {
      const label = document.createElement("label");
      label.className =
        "animated-canvas-gallery-controls__field";

      if (field.control === "checkbox") {
        label.dataset.control = "checkbox";
      }

      const text = document.createElement("span");
      text.className =
        "animated-canvas-gallery-controls__label";
      text.textContent = field.label;

      const input = createInput(field);
      input.dataset.attribute = field.attr;

      let output = null;

      if (field.control === "range") {
        output = document.createElement("output");
        output.className =
          "animated-canvas-gallery-controls__output";
      }

      label.append(text, input);

      if (output) {
        label.append(output);
      }

      const writeAttribute = () => {
        const value =
          field.control === "checkbox"
            ? String(input.checked)
            : input.value;

        root.setAttribute(field.attr, value);

        if (
          field.presetPart &&
          root.getAttribute("data-animation-preset") !==
            "custom"
        ) {
          root.setAttribute(
            "data-animation-preset",
            "custom",
          );
        }
      };

      input.addEventListener("input", writeAttribute);
      input.addEventListener("change", writeAttribute);

      controls.set(field.name, {
        field,
        label,
        input,
        output,
      });

      grid.append(label);
    }

    panel.append(details);
  }

  const sync = () => {
    for (const {
      field,
      label,
      input,
      output,
    } of controls.values()) {
      const raw =
        root.getAttribute(field.attr) ??
        serialize(field.defaultValue);

      if (field.control === "checkbox") {
        input.checked = raw === "true" || raw === "";
      } else if (input.value !== raw) {
        input.value = raw;
      }

      if (output) {
        output.value = raw;
      }

      label.hidden = !matchesVisibility(
        root,
        fieldsByName,
        field.visibleWhen,
      );
    }
  };

  const observer = new MutationObserver(sync);

  observer.observe(root, {
    attributes: true,
    attributeFilter: fields.map(
      (field) => field.attr,
    ),
  });

  let feedbackTimer = 0;

  copyButton.addEventListener("click", async () => {
    const snapshot = createPresetSnapshot({
      root,
      fields,
      variant,
    });

    try {
      await copyText(
        JSON.stringify(snapshot, null, 2),
      );
      copyButton.textContent = "скопировано";
    } catch (error) {
      console.error(error);
      copyButton.textContent = "ошибка";
    }

    clearTimeout(feedbackTimer);

    feedbackTimer = window.setTimeout(() => {
      copyButton.textContent = "копировать пресет";
    }, 1400);
  });

  sync();

  return {
    element: panel,

    dispose() {
      observer.disconnect();
      clearTimeout(feedbackTimer);
    },
  };
}
