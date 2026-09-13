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
    canonical = (
        value
        .replace(LEGACY_UPPER, "AWFUL")
        .replace(LEGACY_TITLE, "Awful")
        .replace(LEGACY_LOWER, "awful")
    )
    return (
        canonical
        .replace("Привет. Я Awful.", "Привет.")
        .replace("Hi. I'm Awful.", "Hi.")
    )


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


tracked = [
    path
    for path in subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
    if path
]

for path in tracked:
    file_path = Path(path)
    try:
        text = file_path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, IsADirectoryError):
        continue
    migrated = replace_name(text)
    if migrated != text:
        file_path.write_text(migrated, encoding="utf-8")

for old in sorted(tracked, key=lambda value: (value.count("/"), len(value)), reverse=True):
    new = replace_name(old)
    if new == old or not os.path.exists(old):
        continue
    Path(new).parent.mkdir(parents=True, exist_ok=True)
    os.replace(old, new)

subprocess.run(["git", "add", "-A"], check=True)
raw = subprocess.check_output(["git", "diff", "--cached", "--name-status", "-z"]).split(b"\0")
i = 0
ops: list[tuple[str, str]] = []
while i < len(raw) and raw[i]:
    code = raw[i].decode()
    i += 1
    if code.startswith("R"):
        old = raw[i].decode()
        new = raw[i + 1].decode()
        i += 2
        ops.extend([("write", new), ("delete", old)])
    else:
        path = raw[i].decode()
        i += 1
        ops.append(("delete" if code == "D" else "write", path))

failures: list[str] = []
for kind, path in sorted(ops, key=lambda item: item[1]):
    if path == "tools/migrate-awful-canonical.py":
        continue
    print(f"{kind}: {path}")
    if not mutate(kind, path):
        failures.append(f"{kind}:{path}")

if failures:
    print("FAILED OPERATIONS:", failures)
    raise SystemExit(1)

if not ops:
    print("No naming migration changes required.")
