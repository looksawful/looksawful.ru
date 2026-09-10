const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

type StackEntry = {
  tagName: string;
  deferredVideo: boolean;
};

function attributePresent(tag: string, name: string): boolean {
  return new RegExp(`\\s${name}(?:\\s*=|\\s|>)`, "i").test(`${tag}>`);
}

function deferVideoOpeningTag(tag: string): string {
  const preloadMatch = tag.match(/\spreload="([^"]*)"/i);
  const preload = preloadMatch?.[1] ?? "metadata";

  let next = tag.replace(/\ssrc="([^"]+)"/i, ' data-autoplay-src="$1"');
  next = next.replace(/\spreload="[^"]*"/i, ' preload="none"');

  if (!/\spreload="/i.test(next)) {
    next = next.replace(/>$/, ' preload="none">');
  }

  return next.replace(
    />$/,
    ` data-autoplay-deferred="" data-autoplay-preload="${preload}">`,
  );
}

function deferSourceTag(tag: string): string {
  return tag.replace(/\ssrc="([^"]+)"/i, ' data-autoplay-src="$1"');
}

export function deferHomepageAutoplayMedia(html: string): string {
  const tagPattern = /<\/?[a-zA-Z][^>]*>/g;
  const stack: StackEntry[] = [];
  let cursor = 0;
  let output = "";

  for (const match of html.matchAll(tagPattern)) {
    const tag = match[0];
    const index = match.index ?? cursor;
    output += html.slice(cursor, index);

    const closing = /^<\//.test(tag);
    const nameMatch = tag.match(/^<\/?\s*([a-zA-Z0-9-]+)/);
    const tagName = nameMatch?.[1]?.toLowerCase() ?? "";

    if (closing) {
      output += tag;
      for (let stackIndex = stack.length - 1; stackIndex >= 0; stackIndex -= 1) {
        const entry = stack[stackIndex];
        stack.pop();
        if (entry?.tagName === tagName) break;
      }
      cursor = index + tag.length;
      continue;
    }

    const parentVideo = [...stack].reverse().find((entry) => entry.tagName === "video");
    const isDeferredVideo = tagName === "video" && attributePresent(tag, "autoplay");

    let renderedTag = tag;
    if (isDeferredVideo) {
      renderedTag = deferVideoOpeningTag(tag);
    } else if (tagName === "source" && parentVideo?.deferredVideo) {
      renderedTag = deferSourceTag(tag);
    }

    output += renderedTag;

    const selfClosing = /\/>$/.test(tag) || VOID_TAGS.has(tagName);
    if (!selfClosing) {
      stack.push({
        tagName,
        deferredVideo: isDeferredVideo,
      });
    }

    cursor = index + tag.length;
  }

  return output + html.slice(cursor);
}
