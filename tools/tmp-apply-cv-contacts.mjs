import { readFile, writeFile } from "node:fs/promises";

function replaceExactlyOnce(source, pattern, replacement, label) {
  const matches = source.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) ?? [];
  if (matches.length !== 1) {
    throw new Error(`${label}: expected exactly one match, got ${matches.length}`);
  }
  return source.replace(pattern, replacement);
}

async function update(path, transform) {
  const before = await readFile(path, "utf8");
  const after = transform(before);
  if (after === before) throw new Error(`${path}: transform made no change`);
  await writeFile(path, after, "utf8");
}

await update("src/content/cv.json", (source) => replaceExactlyOnce(
  source,
  /(    "aboutSecondary":\s*"[^"]*",\n)(    "principles": \[)/,
  `$1    "contacts": {\n      "location": "Москва, Россия",\n      "phone": "+7 999 113 89 17",\n      "telegram": "@looksawful",\n      "instagram": "@looksawful",\n      "email": "i@lookawful.ru",\n      "website": "https://www.looksawful.ru"\n    },\n$2`,
  "cv.json profile contacts insertion",
));

await update("src/data/cv.ts", (source) => {
  let next = replaceExactlyOnce(
    source,
    /export interface CvProfileData \{\n/,
    `export interface CvContactData {\n  location: string;\n  phone: string;\n  telegram: string;\n  instagram: string;\n  email: string;\n  website: string;\n}\n\nexport interface CvProfileData {\n`,
    "CvContactData interface insertion",
  );
  next = replaceExactlyOnce(
    next,
    /(export interface CvProfileData \{\n(?:[\s\S]*?)  aboutSecondary: string;\n)(  principles:)/,
    `$1  contacts: CvContactData;\n$2`,
    "CvProfileData contacts field",
  );
  next = replaceExactlyOnce(
    next,
    /function parseProfile\(value: unknown\): CvProfileData \{/,
    `function parseContacts(value: unknown): CvContactData {\n  const label = "cv.profile.contacts";\n  if (!isRecord(value)) throw new Error(\`${'${label}'} must be an object\`);\n\n  const requireTrimmed = (key: string): string => {\n    const fieldValue = requireNonEmptyString(value, key, label);\n    if (fieldValue.trim() !== fieldValue || fieldValue.trim().length === 0) {\n      throw new Error(\`${'${label}'}.${'${key}'} must be a trimmed non-empty string\`);\n    }\n    return fieldValue;\n  };\n\n  const location = requireTrimmed("location");\n  const phone = requireTrimmed("phone");\n  const telegram = requireTrimmed("telegram");\n  const instagram = requireTrimmed("instagram");\n  const email = requireTrimmed("email");\n  const website = requireTrimmed("website");\n\n  const telHref = phone.replace(/[ ()-]/g, "");\n  if (!/^\\+\\d{7,15}$/.test(telHref)) {\n    throw new Error(\`${'${label}'}.phone must be an international phone number beginning with +\`);\n  }\n  if (!/^@[A-Za-z0-9_]{5,32}$/.test(telegram)) {\n    throw new Error(\`${'${label}'}.telegram must be an @username handle\`);\n  }\n  if (!/^@[A-Za-z0-9._]{1,30}$/.test(instagram)) {\n    throw new Error(\`${'${label}'}.instagram must be an @username handle\`);\n  }\n  if (!/^[^\\s@<>:]+@[^\\s@<>:]+\\.[^\\s@<>:]+$/.test(email)) {\n    throw new Error(\`${'${label}'}.email must be a valid email address\`);\n  }\n\n  let parsedWebsite: URL;\n  try {\n    parsedWebsite = new URL(website);\n  } catch {\n    throw new Error(\`${'${label}'}.website must be an absolute HTTP(S) URL\`);\n  }\n  if (!(["http:", "https:"] as const).includes(parsedWebsite.protocol as "http:" | "https:")) {\n    throw new Error(\`${'${label}'}.website must use http or https\`);\n  }\n  if (parsedWebsite.username || parsedWebsite.password) {\n    throw new Error(\`${'${label}'}.website must not include credentials\`);\n  }\n\n  return Object.freeze({ location, phone, telegram, instagram, email, website });\n}\n\nfunction parseProfile(value: unknown): CvProfileData {`,
    "parseContacts helper",
  );
  next = replaceExactlyOnce(
    next,
    /(    aboutSecondary: requireNonEmptyString\(value, "aboutSecondary", "cv\.profile"\),\n)(    principles:)/,
    `$1    contacts: parseContacts(value.contacts),\n$2`,
    "parseProfile contacts",
  );
  return next;
});

await update("tools/lib/cv-content.mjs", (source) => {
  let next = replaceExactlyOnce(
    source,
    /export function transformCvSkills\(html, content\) \{/,
    `export function transformCvContacts(html, content) {\n  const contacts = content.profile?.contacts;\n  if (!contacts) throw new Error("CV profile.contacts content is required");\n\n  const phoneHref = \`tel:${'${contacts.phone.replace(/[^+\\d]/g, "")}'}\`;\n  const telegramHref = \`https://t.me/${'${contacts.telegram.slice(1)}'}\`;\n  const instagramHref = \`https://www.instagram.com/${'${contacts.instagram.slice(1)}'}/\`;\n  const emailHref = \`mailto:${'${contacts.email}'}\`;\n\n  const contactsPattern = /(<div\\b(?=[^>]*\\bclass=["'][^"']*\\bcontacts\\b[^"']*["'])[^>]*>)[\\s\\S]*?(<\\/div>)/i;\n  let transformed = replaceExactlyOnce(\n    html,\n    contactsPattern,\n    (_match, open, close) =>\n      \`${'${open}'}${'${escapeHtml(contacts.location)}'}<br/><a href="${'${escapeHtml(phoneHref)}'}">${'${escapeHtml(contacts.phone)}'}</a><br/>Telegram: <a href="${'${escapeHtml(telegramHref)}'}" rel="noopener noreferrer" target="_blank">${'${escapeHtml(contacts.telegram)}'}</a><br/>Instagram: <a href="${'${escapeHtml(instagramHref)}'}" rel="noopener noreferrer" target="_blank">${'${escapeHtml(contacts.instagram)}'}</a><br/>email: <a href="${'${escapeHtml(emailHref)}'}">${'${escapeHtml(contacts.email)}'}</a>${'${close}'}\`,\n    ".contacts block",\n  );\n\n  const urlPattern = /(<div\\b(?=[^>]*\\bclass=["'][^"']*\\burl\\b[^"']*["'])[^>]*>)[\\s\\S]*?(<\\/div>)/i;\n  transformed = replaceExactlyOnce(\n    transformed,\n    urlPattern,\n    (_match, open, close) =>\n      \`${'${open}'}<a href="${'${escapeHtml(contacts.website)}'}" rel="noopener noreferrer" target="_blank">${'${escapeHtml(contacts.website)}'}</a>${'${close}'}\`,\n    ".url contact block",\n  );\n\n  return transformed;\n}\n\nexport function transformCvSkills(html, content) {`,
    "transformCvContacts export",
  );
  next = replaceExactlyOnce(
    next,
    /  const withProfile = transformCvProfile\(html, content\);\n  const withSkills = transformCvSkills\(withProfile, content\);/,
    `  const withProfile = transformCvProfile(html, content);\n  const withContacts = transformCvContacts(withProfile, content);\n  const withSkills = transformCvSkills(withContacts, content);`,
    "combined CV transform contacts stage",
  );
  return next;
});

await update(".pages.yml", (source) => replaceExactlyOnce(
  source,
  /(          - name: aboutSecondary\n            label: О себе — абзац 2\n            type: text\n            required: true\n)(          - name: principles\n)/,
  `$1          - name: contacts\n            label: Контакты\n            type: object\n            required: true\n            fields:\n              - name: location\n                label: Местоположение\n                type: string\n                required: true\n                description: Отображаемый город / страна.\n              - name: phone\n                label: Телефон\n                type: string\n                required: true\n                description: Международный номер с +. Ссылка tel: формируется сайтом автоматически.\n              - name: telegram\n                label: Telegram\n                type: string\n                required: true\n                description: Только handle в формате @username. Ссылка t.me формируется сайтом автоматически.\n              - name: instagram\n                label: Instagram\n                type: string\n                required: true\n                description: Только handle в формате @username. Ссылка Instagram формируется сайтом автоматически.\n              - name: email\n                label: Email\n                type: string\n                required: true\n                description: Email как он должен отображаться. Ссылка mailto: формируется сайтом автоматически.\n              - name: website\n                label: Сайт\n                type: string\n                required: true\n                description: Полный адрес сайта с https://. Разрешены только http/https URL.\n$2`,
  "Pages CMS contacts block",
));

await update("test/cv-profile-cms.test.mjs", (source) => {
  let next = replaceExactlyOnce(
    source,
    /(  const current = JSON\.parse\(contentRaw\);\n\n)(  assert\.throws\()/,
    `$1  const validProfile = { ...clone(expectedProfile), contacts: current.profile.contacts };\n\n$2`,
    "profile parser live contacts fixture",
  );
  next = next.replaceAll("const duplicatePrinciples = clone(expectedProfile);", "const duplicatePrinciples = clone(validProfile);");
  next = next.replaceAll("const unknownLanguage = clone(expectedProfile);", "const unknownLanguage = clone(validProfile);");
  next = next.replaceAll("const emptyRole = clone(expectedProfile);", "const emptyRole = clone(validProfile);");
  if (!next.includes("clone(validProfile)")) throw new Error("profile parser fixture replacements did not apply");
  return next;
});

console.log("Applied CV contacts implementation to exactly five tracked files.");
