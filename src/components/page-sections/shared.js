export const projectAsset = (path) => new URL(`../../assets/projects/${path}`, import.meta.url).href;

export const joinMarkup = (items, renderItem) => items.map(renderItem).join("");

export const styleVars = (vars) =>
  Object.entries(vars)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([name, value]) => `${name}: ${value}`)
    .join("; ");
