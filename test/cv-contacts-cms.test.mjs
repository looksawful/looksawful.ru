import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvDataModuleUrl = new URL("../src/data/cv.ts", import.meta.url);
const cvContentUrl = new URL("../src/content/cv.json", import.meta.url);
const cvSourceUrl = new URL("../public/cv/index.html", import.meta.url);
const cvContentLibUrl = new URL("../tools/lib/cv-content.mjs", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);

const expectedContacts = {
  location: "Москва, Россия",
  phone: "+7 999 113 89 17",
  telegram: "@looksawful",
  instagram: "@looksawful",
  email: "i@lookawful.ru",
  website: "https://www.looksawful.ru",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("CV contacts migration fixture reproduces the authored contact markup", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  assert.equal(typeof contentLib.transformCvContacts, "function");
  assert.deepEqual(cvContent.profile.contacts, expectedContacts);
  assert.equal(contentLib.transformCvContacts(sourceHtml, cvContent), sourceHtml);
});

test("CV contacts render safe code-owned hrefs while keeping authored display values", async () => {
  const [{ cvContent }, sourceHtml, contentLib] = await Promise.all([
    import(cvDataModuleUrl.href),
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  const contacts = {
    location: "Berlin <HQ> & Moscow",
    phone: "+49 123 456 789",
    telegram: "@new_name",
    instagram: "@new.name",
    email: "new@example.com",
    website: "https://example.com/path?x=1&y=2",
  };
  const content = {
    ...cvContent,
    profile: { ...cvContent.profile, contacts },
  };
  const transformed = contentLib.transformCvContacts(sourceHtml, content);

  assert.match(transformed, /Berlin &lt;HQ&gt; &amp; Moscow/);
  assert.match(transformed, /href="tel:\+49123456789">\+49 123 456 789<\/a>/);
  assert.match(transformed, /Telegram: <a href="https:\/\/t\.me\/new_name" rel="noopener noreferrer" target="_blank">@new_name<\/a>/);
  assert.match(transformed, /Instagram: <a href="https:\/\/www\.instagram\.com\/new\.name\/" rel="noopener noreferrer" target="_blank">@new\.name<\/a>/);
  assert.match(transformed, /email: <a href="mailto:new@example\.com">new@example\.com<\/a>/);
  assert.match(transformed, /class="url"><a href="https:\/\/example\.com\/path\?x=1&amp;y=2" rel="noopener noreferrer" target="_blank">https:\/\/example\.com\/path\?x=1&amp;y=2<\/a>/);
  assert.doesNotMatch(transformed, /javascript:/i);
  assert.doesNotMatch(transformed, /data:/i);
});

test("CV content adapter rejects malformed contact values and unsafe website schemes", async () => {
  const { parseCvContent, cvContent } = await import(cvDataModuleUrl.href);
  const current = clone(cvContent);
  const baseContacts = clone(expectedContacts);

  const blankContacts = Object.fromEntries(Object.keys(baseContacts).map((key) => [key, "   "]));
  const parsedBlank = parseCvContent({
    ...current,
    profile: { ...current.profile, contacts: blankContacts },
  });
  assert.deepEqual(parsedBlank.profile.contacts, {
    location: "",
    phone: "",
    telegram: "",
    instagram: "",
    email: "",
    website: "",
  });

  const parsedMissing = parseCvContent({
    ...current,
    profile: { ...current.profile, contacts: {} },
  });
  assert.deepEqual(parsedMissing.profile.contacts, parsedBlank.profile.contacts);

  for (const [key, value, pattern] of [
    ["phone", "call me", /contacts\.phone/i],
    ["telegram", "looksawful", /contacts\.telegram/i],
    ["instagram", "looks awful", /contacts\.instagram/i],
    ["instagram", "@.", /contacts\.instagram/i],
    ["instagram", "@..", /contacts\.instagram/i],
    ["instagram", "@.name", /contacts\.instagram/i],
    ["instagram", "@name.", /contacts\.instagram/i],
    ["instagram", "@name..name", /contacts\.instagram/i],
    ["email", "not-an-email", /contacts\.email/i],
    ["email", ".first@example.com", /contacts\.email/i],
    ["email", "first.@example.com", /contacts\.email/i],
    ["email", "first..last@example.com", /contacts\.email/i],
    ["email", "me@.example.com", /contacts\.email/i],
    ["email", "me@example..com", /contacts\.email/i],
    ["email", "me@example.com.", /contacts\.email/i],
    ["website", "javascript:alert(1)", /contacts\.website/i],
  ]) {
    const contacts = { ...baseContacts, [key]: value };
    assert.throws(
      () => parseCvContent({
        ...current,
        profile: { ...current.profile, contacts },
      }),
      pattern,
      `${key} must fail closed`,
    );
  }

  assert.throws(
    () => parseCvContent({
      ...current,
      profile: { ...current.profile, contacts: { ...baseContacts, location: 42 } },
    }),
    /contacts\.location.*string/i,
  );
});

test("Pages CMS exposes only authored CV location while structural contacts stay outside the editor", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const cvConfig = cmsConfig.match(/\n  - name: cv\b[\s\S]*$/)?.[0] ?? "";
  const profileConfig = cvConfig.match(/\n      - name: profile\b[\s\S]*?(?=\n      - name: skills\b)/)?.[0] ?? "";

  assert.match(profileConfig, /name: location\b[\s\S]*?type: string/);
  assert.doesNotMatch(profileConfig, /name: contacts\b/);
  for (const field of ["phone", "telegram", "instagram", "email", "website"]) {
    assert.doesNotMatch(cvConfig, new RegExp(`- name: ${field}\\b`));
  }
  assert.doesNotMatch(cvConfig, /name: (href|target|rel|route|canonical)\b/);
});
