import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvSourceUrl = new URL("../public/cv/index.html", import.meta.url);
const cvContentLibUrl = new URL("../tools/lib/cv-content.mjs", import.meta.url);

test("CV principle body starts with a lowercase letter when a title is present", async () => {
  const [sourceHtml, contentLib] = await Promise.all([
    readFile(cvSourceUrl, "utf8"),
    import(cvContentLibUrl.href),
  ]);

  const transformed = contentLib.transformCvProfile(sourceHtml, {
    profile: {
      name: "",
      role: "",
      aboutPrimary: "",
      aboutSecondary: "",
      principles: [
        {
          title: "Заголовок:",
          text: "Текст с прописной буквы.",
        },
      ],
      languages: [],
    },
  });

  assert.match(transformed, /<b>Заголовок:<\/b> текст с прописной буквы\./);
  assert.doesNotMatch(transformed, /<b>Заголовок:<\/b> Текст с прописной буквы\./);
});
