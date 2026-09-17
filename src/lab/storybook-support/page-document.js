const BODY_PATTERN = /<body\b[^>]*>([\s\S]*?)<\/body>/i;
const SCRIPT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/gi;

export function extractPageBody(html) {
  const body = html.match(BODY_PATTERN)?.[1];
  if (body === undefined) {
    throw new Error("Storybook page fixture requires a complete production document with <body>");
  }

  return body.replace(SCRIPT_PATTERN, "").trim();
}
