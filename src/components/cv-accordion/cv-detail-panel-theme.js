export function resolveCvDetailPanelTheme({ trigger } = {}) {
  const source = trigger?.closest?.(".cv-item");
  if (!(source instanceof HTMLElement)) return null;

  const styles = getComputedStyle(source);
  const background =
    styles.getPropertyValue("--item-bg").trim() || styles.backgroundColor;
  const foreground =
    styles.getPropertyValue("--item-ink").trim() || styles.color;

  return {
    background: background || null,
    foreground: foreground || null,
  };
}
