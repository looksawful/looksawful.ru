const iconSvg = (body, viewBox = "0 0 24 24") =>
  '<svg class="pet-tech-list__icon" viewBox="' +
  viewBox +
  '" aria-hidden="true" focusable="false">' +
  body +
  "</svg>";

const TECH_ICONS = {
  figma: iconSvg(
    '<path d="M10 3h4a3 3 0 0 1 0 6h-4V3Z" fill="currentColor"/><path d="M10 9h4a3 3 0 0 1 0 6h-4V9Z" fill="currentColor" opacity=".72"/><path d="M10 15h3a3 3 0 1 1-3 3v-3Z" fill="currentColor" opacity=".52"/><path d="M7 3h3v6H7a3 3 0 0 1 0-6Z" fill="currentColor" opacity=".9"/><path d="M7 9h3v6H7a3 3 0 0 1 0-6Z" fill="currentColor" opacity=".64"/>'
  ),
  cjm: iconSvg(
    '<path d="M4 7h4l2.2 8 3.2-11L16 17l2.2-7H21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="7" r="1.6" fill="currentColor"/><circle cx="21" cy="10" r="1.6" fill="currentColor"/>'
  ),
  prototype: iconSvg(
    '<rect x="4" y="4" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="currentColor" opacity=".52"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="currentColor" opacity=".52"/><path d="M12 15h6m0 0-2.4-2.4M18 15l-2.4 2.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  designSystem: iconSvg(
    '<path d="M4 5h16M4 12h16M4 19h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 3v18M12 3v18M17 3v18" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".46"/>'
  ),
  devMode: iconSvg(
    '<path d="m9 7-5 5 5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m13 5-2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".62"/>'
  ),
  tokens: iconSvg(
    '<circle cx="7" cy="8" r="3" fill="currentColor"/><circle cx="16.5" cy="7.5" r="2.5" fill="currentColor" opacity=".58"/><circle cx="14" cy="16" r="4" fill="currentColor" opacity=".78"/><path d="M9.2 10.2 11.6 13M14 8.6l-.8 3.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".42"/>'
  ),
  components: iconSvg(
    '<rect x="4" y="4" width="6" height="6" rx="1.4" fill="currentColor"/><rect x="14" y="4" width="6" height="6" rx="1.4" fill="currentColor" opacity=".64"/><rect x="4" y="14" width="6" height="6" rx="1.4" fill="currentColor" opacity=".64"/><rect x="14" y="14" width="6" height="6" rx="1.4" fill="currentColor"/>'
  ),
  notion: iconSvg(
    '<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 16V8h2.15l4.9 6.15V8H17v8h-2.05L10 9.78V16H8Z" fill="currentColor"/>'
  ),
  html: iconSvg(
    '<path d="M5 3h14l-1.25 15.1L12 21l-5.75-2.9L5 3Z" fill="currentColor"/><path d="M9 8h6M8.7 11h6.6M9.2 14.1h4.7l-.15 1.6L12 16.6l-1.75-.9-.1-1" fill="none" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  css: iconSvg(
    '<path d="M5 3h14l-1.25 15.1L12 21l-5.75-2.9L5 3Z" fill="currentColor"/><path d="M9 8h7l-.24 2.2H9.2L9.4 12H15.5l-.44 4.6L12 18.1l-3.05-1.5-.18-2.1h2.1l.08.84 1.05.52 1.08-.52.12-1.34H8.68L8 6h8.2l-.2 2H9Z" fill="#fff"/>'
  ),
  javascript: iconSvg(
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/><path d="M8 16.2c.38.62.82.92 1.52.92.84 0 1.28-.46 1.28-1.38V9h2.02v6.78c0 2-1.16 3.08-3.12 3.08-1.48 0-2.48-.58-3.18-1.72l1.48-.94Zm6.28.7c.7.7 1.42 1.02 2.26 1.02.82 0 1.28-.32 1.28-.86 0-.58-.48-.8-1.58-1.04-1.62-.36-2.58-.98-2.58-2.56 0-1.48 1.16-2.58 3.02-2.58 1.22 0 2.18.36 2.92 1.1l-1.08 1.36c-.56-.52-1.12-.76-1.78-.76-.72 0-1.1.28-1.1.76 0 .52.44.7 1.5.94 1.78.4 2.72 1.02 2.72 2.64 0 1.56-1.18 2.7-3.26 2.7-1.42 0-2.54-.44-3.42-1.3l1.1-1.44Z" fill="#fff"/>'
  ),
  typescript: iconSvg(
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/><path d="M8 9h8M12 9v9M16.5 13.6c-.5-.35-1-.52-1.62-.52-.78 0-1.18.28-1.18.72 0 .48.45.66 1.38.86 1.58.34 2.5.9 2.5 2.25 0 1.42-1.12 2.33-3.02 2.33-1.08 0-2.04-.28-2.86-.88" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'
  ),
  react: iconSvg(
    '<circle cx="12" cy="12" r="2.2" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(120 12 12)"/>'
  ),
  canvas: iconSvg(
    '<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 15c2-4 4-4 6-1 1.2 1.8 2 .8 4-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  motion: iconSvg(
    '<path d="M5 12h7M5 7h12M5 17h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="m15 13 4 4m0 0-4 4m4-4H11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  fallback: iconSvg('<circle cx="12" cy="12" r="7" fill="currentColor"/>'),
};

const aliases = [
  ["figma", "figma"],
  ["cjm", "cjm"],
  ["journey", "cjm"],
  ["прототип", "prototype"],
  ["prototype", "prototype"],
  ["дизайн-система", "designSystem"],
  ["design-system", "designSystem"],
  ["design system", "designSystem"],
  ["dev mode", "devMode"],
  ["devmode", "devMode"],
  ["token", "tokens"],
  ["токен", "tokens"],
  ["component", "components"],
  ["компонент", "components"],
  ["notion", "notion"],
  ["html", "html"],
  ["css", "css"],
  ["javascript", "javascript"],
  ["js", "javascript"],
  ["typescript", "typescript"],
  ["ts", "typescript"],
  ["react", "react"],
  ["canvas", "canvas"],
  ["анима", "motion"],
  ["motion", "motion"],
];

export const getTechIcon = (technology = "") => {
  const key = String(technology).trim().toLowerCase();

  for (const [needle, iconName] of aliases) {
    if (key === needle || key.includes(needle)) {
      return TECH_ICONS[iconName];
    }
  }

  return TECH_ICONS.fallback;
};
