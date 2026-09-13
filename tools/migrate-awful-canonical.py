from __future__ import annotations

import base64
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

REPO = os.environ["REPO"]
BRANCH = os.environ.get("BRANCH", "contact-hub-frontend-current")
TOKEN = os.environ["GH_TOKEN"]
LEGACY_LOWER = "ve" + "nus"
LEGACY_TITLE = "Ve" + "nus"
LEGACY_UPPER = "VE" + "NUS"


def replace_name(value: str) -> str:
    canonical = value.replace(LEGACY_UPPER, "AWFUL").replace(LEGACY_TITLE, "Awful").replace(LEGACY_LOWER, "awful")
    return canonical.replace("Привет. Я Awful.", "Привет.").replace("Hi. I'm Awful.", "Hi.")


def replace_file(path: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    for old, new in replacements:
        text = text.replace(old, new)
    p.write_text(text, encoding="utf-8")


def request(method: str, path: str, payload: dict | None = None, *, ref: bool = False):
    encoded = urllib.parse.quote(path, safe="/")
    url = f"https://api.github.com/repos/{REPO}/contents/{encoded}"
    if ref:
        url += "?ref=" + urllib.parse.quote(BRANCH, safe="")
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    data = None if payload is None else json.dumps(payload).encode()
    with urllib.request.urlopen(req, data=data, timeout=60) as response:
        return json.loads(response.read().decode())


def current_sha(path: str) -> str | None:
    try:
        result = request("GET", path, ref=True)
        return result.get("sha")
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        raise


def mutate(kind: str, path: str) -> bool:
    for attempt in range(1, 8):
        try:
            sha = current_sha(path)
            if kind == "delete":
                if sha is None:
                    return True
                request("DELETE", path, {
                    "message": f"chore: remove obsolete {path}",
                    "sha": sha,
                    "branch": BRANCH,
                })
                return True

            raw = Path(path).read_bytes()
            payload = {
                "message": f"chore: canonical Awful migration for {path}",
                "content": base64.b64encode(raw).decode(),
                "branch": BRANCH,
            }
            if sha is not None:
                payload["sha"] = sha
            request("PUT", path, payload)
            return True
        except urllib.error.HTTPError as exc:
            body = exc.read().decode(errors="replace")
            print(f"attempt {attempt} failed for {kind} {path}: HTTP {exc.code} {body}")
            if exc.code not in {409, 422, 500, 502, 503, 504}:
                return False
            time.sleep(min(12, attempt * 2))
        except Exception as exc:
            print(f"attempt {attempt} failed for {kind} {path}: {exc}")
            time.sleep(min(12, attempt * 2))
    return False


tracked = [p for p in subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0") if p]

for path in tracked:
    p = Path(path)
    try:
        text = p.read_text(encoding="utf-8")
    except (UnicodeDecodeError, IsADirectoryError):
        continue
    new = replace_name(text)
    if new != text:
        p.write_text(new, encoding="utf-8")

for old in sorted(tracked, key=lambda x: (x.count("/"), len(x)), reverse=True):
    new = replace_name(old)
    if new == old or not os.path.exists(old):
        continue
    Path(new).parent.mkdir(parents=True, exist_ok=True)
    os.replace(old, new)

replace_file("src/components/contact-hub.ts", [
    ('''  const modes = documentRef.createElement("div");\n  modes.className = "contact-hub__modes";\n  const aiModeButton = createTextButton(documentRef, "AI");\n  aiModeButton.dataset.contactHubMode = "ai";\n  const formModeButton = createTextButton(documentRef, "написать");\n  formModeButton.dataset.contactHubMode = "form";\n  modes.append(aiModeButton, formModeButton);\n\n''', ""),
    ('  header.append(modes, collapseButton, closeButton);', '  header.append(collapseButton, closeButton);'),
    ('    aiModeButton,\n    formModeButton,\n', ''),
    ('    hub, collapsedLauncher, collapseButton, closeButton, aiModeButton, formModeButton,\n', '    hub, collapsedLauncher, collapseButton, closeButton,\n'),
    ('    aiModeButton.setAttribute("aria-current", state.mode === "ai" ? "page" : "false");\n    formModeButton.setAttribute("aria-current", state.mode === "form" ? "page" : "false");\n', ''),
    ('  const openAiMode = (): void => setMode("ai");\n  const openFormMode = (): void => setMode("form");\n\n', ''),
    ('  aiModeButton.addEventListener("click", openAiMode);\n  formModeButton.addEventListener("click", openFormMode);\n', ''),
    ('    aiModeButton.removeEventListener("click", openAiMode);\n    formModeButton.removeEventListener("click", openFormMode);\n', ''),
    ('composerInput.placeholder = "спросить Awful";', 'composerInput.placeholder = "follow up";'),
    ('Можно переключиться на «написать» и связаться напрямую.', 'Можно связаться напрямую через форму контакта.'),
])

replace_file("src/components/portfolio-pet.ts", [
    ('  launcher.setAttribute("aria-label", "Открыть чат с Awful");\n', '  launcher.setAttribute("aria-label", "Открыть чат с Awful");\n\n  const dismissButton = root.createElement("button");\n  dismissButton.type = "button";\n  dismissButton.className = "portfolio-pet__dismiss";\n  dismissButton.dataset.portfolioPetDismiss = "";\n  dismissButton.setAttribute("aria-label", "Скрыть Awful");\n  dismissButton.textContent = "×";\n\n  const restoreButton = root.createElement("button");\n  restoreButton.type = "button";\n  restoreButton.className = "portfolio-pet__restore";\n  restoreButton.dataset.portfolioPetRestore = "";\n  restoreButton.setAttribute("aria-label", "Показать Awful");\n  restoreButton.textContent = "→";\n  restoreButton.hidden = true;\n'),
    ('  root.body.append(launcher);\n', '  root.body.append(launcher, dismissButton, restoreButton);\n'),
    ('  let observedConsent: HTMLElement | null = null;\n', '  let observedConsent: HTMLElement | null = null;\n\n  const syncPetControls = (): void => {\n    if (launcher.hidden) return;\n    const rect = launcher.getBoundingClientRect();\n    dismissButton.style.left = `${Math.round(rect.right - 26)}px`;\n    dismissButton.style.top = `${Math.round(rect.top + 8)}px`;\n  };\n\n  const hidePet = (): void => {\n    const rect = launcher.getBoundingClientRect();\n    launcher.hidden = true;\n    dismissButton.hidden = true;\n    restoreButton.style.top = `${Math.round(Math.max(16, Math.min(rect.top + rect.height / 2 - 18, (view?.innerHeight ?? 800) - 52)))}px`;\n    restoreButton.hidden = false;\n    restoreButton.focus({ preventScroll: true });\n  };\n\n  const restorePet = (): void => {\n    restoreButton.hidden = true;\n    launcher.hidden = false;\n    dismissButton.hidden = false;\n    updateConsentOffset();\n    requestAnimationFrame(() => { syncPetControls(); launcher.focus({ preventScroll: true }); });\n  };\n'),
    ('      dispatchMoved(root, launcher);\n    });\n', '      dispatchMoved(root, launcher);\n      syncPetControls();\n    });\n'),
    ('    dispatchMoved(root, launcher);\n  };\n\n  const finishPointer', '    dispatchMoved(root, launcher);\n    syncPetControls();\n  };\n\n  const finishPointer'),
    ('    if (gesture === "hide") {\n      launcher.hidden = true;\n      return;\n    }', '    if (gesture === "hide") {\n      hidePet();\n      return;\n    }'),
    ('    dispatchMoved(root, launcher);\n  };\n\n  const onClickCapture', '    dispatchMoved(root, launcher);\n    syncPetControls();\n  };\n\n  const onClickCapture'),
    ('      updateConsentOffset();\n      return;\n', '      updateConsentOffset();\n      syncPetControls();\n      return;\n'),
    ('    dispatchMoved(root, launcher);\n  };\n\n  const onPointerEnter', '    dispatchMoved(root, launcher);\n    syncPetControls();\n  };\n\n  const onPointerEnter'),
    ('  launcher.addEventListener("pointerenter", onPointerEnter);', '  dismissButton.addEventListener("click", hidePet);\n  restoreButton.addEventListener("click", restorePet);\n  launcher.addEventListener("pointerenter", onPointerEnter);'),
    ('    launcher.removeEventListener("pointerenter", onPointerEnter);', '    dismissButton.removeEventListener("click", hidePet);\n    restoreButton.removeEventListener("click", restorePet);\n    launcher.removeEventListener("pointerenter", onPointerEnter);'),
    ('    launcher.remove();\n', '    launcher.remove();\n    dismissButton.remove();\n    restoreButton.remove();\n'),
    ('  view?.requestAnimationFrame(() => updateConsentOffset());\n', '  view?.requestAnimationFrame(() => { updateConsentOffset(); syncPetControls(); });\n'),
])

css = Path("src/styles/portfolio-pet.css")
text = css.read_text(encoding="utf-8")
if ".portfolio-pet__restore {" not in text:
    controls = '''\n.portfolio-pet__dismiss,\n.portfolio-pet__restore {\n  position: fixed;\n  z-index: var(--layer-assistant-pet);\n  display: grid;\n  place-items: center;\n  border: 0;\n  background: var(--clr-bg, #fff);\n  color: var(--clr-text, #000);\n  font: inherit;\n  cursor: pointer;\n  -webkit-tap-highlight-color: transparent;\n}\n\n.portfolio-pet__dismiss { inline-size: 28px; block-size: 28px; border-radius: 999px; box-shadow: 0 1px 8px rgb(0 0 0 / 0.12); }\n.portfolio-pet__restore { inset-inline-start: 0; inline-size: 32px; block-size: 44px; border-radius: 0 999px 999px 0; box-shadow: 1px 1px 8px rgb(0 0 0 / 0.12); }\n.portfolio-pet__dismiss:focus-visible, .portfolio-pet__restore:focus-visible { outline: var(--border-width-200) solid currentColor; outline-offset: 2px; }\n\n'''
    css.write_text(text.replace('@media (width <= 42.5rem) {', controls + '@media (width <= 42.5rem) {'), encoding="utf-8")

subprocess.run(["git", "add", "-A"], check=True)
raw = subprocess.check_output(["git", "diff", "--cached", "--name-status", "-z"]).split(b"\0")
i = 0
ops: list[tuple[str, str]] = []
while i < len(raw) and raw[i]:
    code = raw[i].decode(); i += 1
    if code.startswith("R"):
        old = raw[i].decode(); new = raw[i + 1].decode(); i += 2
        ops.extend([("write", new), ("delete", old)])
    else:
        path = raw[i].decode(); i += 1
        ops.append(("delete" if code == "D" else "write", path))

priority = {
    "src/components/contact-hub.ts": 0,
    "src/components/portfolio-pet.ts": 1,
    "src/styles/portfolio-pet.css": 2,
    "src/features/portfolio-pet/awful-manifest.ts": 3,
}
ops.sort(key=lambda item: (priority.get(item[1], 50), item[1]))

failures: list[str] = []
for kind, path in ops:
    if path == "tools/migrate-awful-canonical.py":
        continue
    print(f"{kind}: {path}")
    if not mutate(kind, path):
        failures.append(f"{kind}:{path}")

if failures:
    print("FAILED OPERATIONS:", failures)
    raise SystemExit(1)
