import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

const captionOverrides: Readonly<Record<string, { text?: string; metaFirst?: string }>> = {
  "styx-02-source-01-9x16-use-01": {
    metaFirst: "Каждый кадр получен сканированием объекта на разных сканерах и собран вручную. Искажения и артефакты появились при сканировании, а не в цифровой обработке.",
  },
  "styx-02-source-03-1x1-use-01": {
    metaFirst: "Вместо студийной съёмки я сканировал кольцо на старых и современных сканерах. Современные давали детальное изображение без дорогого фотопродакшена, старые — выразительные искажения и артефакты.",
  },
  "styx-02-source-01-9x16-use-02": {
    text: "Каждый кадр получен сканированием объекта на разных сканерах и собран вручную. Искажения и артефакты появились при сканировании, а не в цифровой обработке.",
  },
  "styx-02-source-03-1x1-use-02": {
    text: "Вместо студийной съёмки я сканировал кольцо на старых и современных сканерах. Современные давали детальное изображение без дорогого фотопродакшена, старые — выразительные искажения и артефакты.",
  },
};

function normalizeStyxJewelName(value: string): string {
  return value
    .replaceAll("Styx Jewels", "Styx Jewel")
    .replace(/\bStyx\b(?!\s+Jewel)/g, "Styx Jewel");
}

export function normalizeStyxCaption(
  entry: MediaEntryData<MediaAssetId, string>,
): MediaEntryData<MediaAssetId, string> {
  if (!entry.caption) {
    return entry;
  }

  const override = captionOverrides[entry.id];
  const caption = { ...entry.caption };

  if (override?.text !== undefined) {
    caption.text = override.text;
  }

  if (override?.metaFirst !== undefined && caption.meta?.length) {
    caption.meta = [override.metaFirst, ...caption.meta.slice(1)];
  }

  if (caption.title) {
    caption.title = normalizeStyxJewelName(caption.title);
  }

  if (caption.text) {
    caption.text = normalizeStyxJewelName(caption.text);
  }

  if (caption.meta?.length) {
    caption.meta = caption.meta.map(normalizeStyxJewelName);
  }

  return { ...entry, caption };
}
