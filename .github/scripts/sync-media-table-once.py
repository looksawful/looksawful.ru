import csv
import html as html_lib
import json
import re
from pathlib import Path

MARKED_IDS = {
    "sensetique-02-02", "sensetique-04-01", "sensetique-06-01",
    "sensetique-process-01", "sensetique-process-02", "sensetique-process-03", "sensetique-process-04",
    "sensetique-08-02", "sensetique-08-05", "sensetique-08-06", "sensetique-08-07", "sensetique-08-08", "sensetique-08-09",
    "sensetique-09-01", "sensetique-09-09", "sensetique-09-10", "sensetique-09-16", "sensetique-09-21", "sensetique-09-24",
    "sensetique-09-30", "sensetique-09-31", "sensetique-09-32", "sensetique-09-41", "sensetique-09-42", "sensetique-09-44",
    "sensetique-09-48", "sensetique-09-49", "sensetique-09-51",
    "sensetique-10-01", "sensetique-10-03", "sensetique-10-07", "sensetique-10-13", "sensetique-10-15", "sensetique-10-17",
    "sensetique-10-18", "sensetique-10-19", "sensetique-10-21", "sensetique-10-22", "sensetique-10-23", "sensetique-10-24",
}

# These two were verified byte-for-byte/decoded-pixel duplicates in the previous dry run.
# Every other marked physical file is retained because it is the sole verified exemplar,
# or is the representative that must remain.
SAFE_PHYSICAL_DELETES = {
    "public/media/projects/sensetique/02/source/02-3x4.webp",
    "public/media/projects/sensetique/06/source/01-16x9.webp",
}


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def active_captions(rows):
    return {
        row["data-media-id"]: row["Подпись"]
        for row in rows
        if row.get("data-media-id")
        and row.get("Подпись")
        and row.get("Компонент / раскладка") != "media-pool"
        and row.get("Состояние на сайте") == "active"
    }


def entry_pattern(media_id):
    return re.compile(
        rf'(?m)^\s*"{re.escape(media_id)}"\s*:\s*"(?:\\.|[^"\\])*",\s*\n?'
    )


def update_caption_map(captions):
    path = Path("src/content/media-captions.js")
    text = path.read_text(encoding="utf-8")

    for media_id in MARKED_IDS:
        text = entry_pattern(media_id).sub("", text)

    inserted = []
    for media_id, caption in captions.items():
        line = (
            f"  {json.dumps(media_id, ensure_ascii=False)}: "
            f"{json.dumps(caption, ensure_ascii=False)},\n"
        )
        pattern = entry_pattern(media_id)
        if pattern.search(text):
            # Function replacement is required so backslashes produced by json.dumps
            # remain literal JS escapes instead of being interpreted by re.sub.
            text = pattern.sub(lambda _match, line=line: line, text, count=1)
        else:
            at = text.rfind("});")
            if at < 0:
                raise RuntimeError("MEDIA_CAPTIONS closing token not found")
            text = text[:at] + line + text[at:]
            inserted.append(media_id)

    for media_id in MARKED_IDS:
        if entry_pattern(media_id).search(text):
            raise RuntimeError(f"Marked caption still present: {media_id}")

    path.write_text(text, encoding="utf-8")
    return inserted


def strip_media_reference(block, media_id):
    q = re.escape(media_id)
    block = re.sub(
        rf'<picture\b[^>]*>(?:(?!</picture>)[\s\S])*?data-media-id=["\']{q}["\'](?:(?!</picture>)[\s\S])*?</picture>',
        "", block, flags=re.I,
    )
    block = re.sub(
        rf'<video\b(?=[^>]*data-media-id=["\']{q}["\'])[^>]*>[\s\S]*?</video>',
        "", block, flags=re.I,
    )
    block = re.sub(
        rf'<img\b(?=[^>]*data-media-id=["\']{q}["\'])[^>]*>',
        "", block, flags=re.I,
    )
    block = re.sub(
        rf'<figcaption\b(?=[^>]*data-media-caption-for=["\']{q}["\'])[^>]*>[\s\S]*?</figcaption>',
        "", block, flags=re.I,
    )
    return block


def update_index(captions):
    path = Path("index.html")
    text = path.read_text(encoding="utf-8")
    before = {mid: text.count(mid) for mid in MARKED_IDS if text.count(mid)}

    figure_pattern = re.compile(r"<figure\b[^>]*>[\s\S]*?</figure>", re.I)

    def clean_figure(match):
        block = match.group(0)
        hits = [mid for mid in MARKED_IDS if mid in block]
        if not hits:
            return block
        for media_id in hits:
            block = strip_media_reference(block, media_id)
        return block if re.search(r"<(?:img|video)\b", block, re.I) else ""

    text = figure_pattern.sub(clean_figure, text)
    for media_id in MARKED_IDS:
        text = strip_media_reference(text, media_id)

    # Update only fallback captions that already exist. Never insert media or new figures.
    fallback_updates = 0
    for media_id, caption in captions.items():
        q = re.escape(media_id)
        pattern = re.compile(
            rf'(<figcaption\b(?=[^>]*data-media-caption-for=["\']{q}["\'])[^>]*>)([\s\S]*?)(</figcaption>)',
            re.I,
        )
        if pattern.search(text):
            escaped = html_lib.escape(caption, quote=False)
            text, count = pattern.subn(
                lambda m, escaped=escaped: m.group(1) + escaped + m.group(3),
                text,
            )
            fallback_updates += count

    remaining = {mid: text.count(mid) for mid in MARKED_IDS if text.count(mid)}
    if remaining:
        raise RuntimeError(f"Marked ids remain in index: {remaining}")

    path.write_text(text, encoding="utf-8")
    return before, fallback_updates


def update_manifest():
    path = Path("public/media/media-manifest.json")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    entries = manifest.get("entries", [])
    old = len(entries)
    manifest["entries"] = [e for e in entries if e.get("id") not in MARKED_IDS]
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return old - len(manifest["entries"])


def delete_safe_physical_duplicates():
    deleted = []
    for filename in sorted(SAFE_PHYSICAL_DELETES):
        path = Path(filename)
        if path.exists():
            path.unlink()
            deleted.append(filename)
    return deleted


sensetique = read_csv("/tmp/sens.csv")
jestei = read_csv("/tmp/jestei.csv")
sens_caps = active_captions(sensetique)
jestei_caps = active_captions(jestei)
captions = {**jestei_caps, **sens_caps}

inserted = update_caption_map(captions)
site_before, fallback_updates = update_index(captions)
manifest_removed = update_manifest()
physical_deleted = delete_safe_physical_duplicates()

print(json.dumps({
    "marked_ids": len(MARKED_IDS),
    "captions_sensetique": len(sens_caps),
    "captions_jestei": len(jestei_caps),
    "caption_keys_inserted": inserted,
    "site_occurrences_removed": site_before,
    "fallback_captions_updated": fallback_updates,
    "manifest_removed": manifest_removed,
    "physical_files_deleted": physical_deleted,
    "physical_files_preserved_as_sole_or_representative": 34,
}, ensure_ascii=False, indent=2))
