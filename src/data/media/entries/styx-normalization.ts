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

export function normalizeStyxCaption(
  entry: MediaEntryData<MediaAssetId, string>,
): MediaEntryData<MediaAssetId, string> {
  const override = captionOverrides[entry.id];

  if (!override || !entry.caption) {
    return entry;
  }

  const caption = { ...entry.caption };

  if (override.text !== undefined) {
    caption.text = override.text;
  }

  if (override.metaFirst !== undefined && caption.meta?.length) {
    caption.meta = [override.metaFirst, ...caption.meta.slice(1)];
  }

  return { ...entry, caption };
}
