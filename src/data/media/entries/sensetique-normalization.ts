import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

const genericCaptionPrefixes = [
  "эдиториал",
  "лукбук",
  "кампейн",
  "фотосъемка",
  "спецпроект",
] as const;

export function normalizeSensetiqueCaption(
  entry: MediaEntryData<MediaAssetId, string>,
): MediaEntryData<MediaAssetId, string> {
  if (!entry.id.startsWith("sensetique-") || !entry.caption?.title) {
    return entry;
  }

  const title = entry.caption.title;
  const normalizedTitle = title.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");

  let namedShootTitle: string | undefined;

  if (normalizedTitle.includes("harshlight") || normalizedTitle.includes("harsh light")) {
    namedShootTitle = "HARSH LIGHT";
  } else if (normalizedTitle.includes("young-pioneer")) {
    namedShootTitle = "Young-pioneer";
  } else if (normalizedTitle.includes("wood.metal.panic!")) {
    namedShootTitle = "Wood.Metal.PANIC!";
  } else if (
    normalizedTitle.includes("digital-fear-of-love")
    || normalizedTitle.includes("digital fear of love")
  ) {
    namedShootTitle = "Digital Fear of Love";
  }

  if (namedShootTitle) {
    return namedShootTitle === title
      ? entry
      : { ...entry, caption: { ...entry.caption, title: namedShootTitle } };
  }

  if (genericCaptionPrefixes.some((prefix) => normalizedTitle.startsWith(prefix))) {
    const { title: _title, ...caption } = entry.caption;
    return { ...entry, caption };
  }

  return entry;
}
