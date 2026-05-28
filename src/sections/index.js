import heroHtml from "./hero/hero.html?raw";
import leadHtml from "./lead/lead.html?raw";
import cvHtml from "./cv/cv.html?raw";

const SECTION_HTML = (content) => content.trim();

export function renderPage(target = document.getElementById("main")) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  target.innerHTML = [SECTION_HTML(heroHtml), SECTION_HTML(leadHtml), SECTION_HTML(cvHtml)].join("\n\n");
}
