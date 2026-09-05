from pathlib import Path
import re
import sys

mode = sys.argv[1] if len(sys.argv) > 1 else ""

if mode == "contracts":
    test_path = Path("test/site-navigation-style.test.mjs")
    source = test_path.read_text()
    source = source.replace(
        'const componentPath = new URL("../src/styles/site-navigation.css", import.meta.url);\n',
        'const componentPath = new URL("../src/styles/site-navigation.css", import.meta.url);\nconst legacyComponentsPath = new URL("../src/styles/components.css", import.meta.url);\n',
    )
    source = source.replace(
        'const componentSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";\n',
        'const componentSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";\nconst legacyComponentsSource = readFileSync(legacyComponentsPath, "utf8");\n',
    )
    needle = '  assert.match(mainSource, /import\\s+["\']\\.\\/styles\\/site-navigation\\.css["\'];/);\n'
    replacement = needle + (
        '  assert.doesNotMatch(\n'
        '    legacyComponentsSource,\n'
        '    /(^|\\n)\\s*\\.site-nav(?:\\b|__)/m,\n'
        '    "global site navigation selectors must stay out of legacy components.css",\n'
        '  );\n'
    )
    if needle not in source:
        raise SystemExit("style contract insertion point missing")
    test_path.write_text(source.replace(needle, replacement, 1))

    smoke_path = Path("tools/smoke-site-navigation.mjs")
    source = smoke_path.read_text()
    replacements = [
        (
            '      const preview = document.querySelector("[data-menu-preview]");\n      const root = document.documentElement;\n      return {',
            '      const preview = document.querySelector("[data-menu-preview]");\n      const siteNav = document.querySelector(".site-nav");\n      const siteNavStyle = siteNav instanceof HTMLElement ? getComputedStyle(siteNav) : null;\n      const root = document.documentElement;\n      return {',
        ),
        (
            '        overflow: root.scrollWidth - root.clientWidth,\n      };',
            '        overflow: root.scrollWidth - root.clientWidth,\n        navBorderBlockEndWidth: siteNavStyle?.borderBlockEndWidth || siteNavStyle?.borderBottomWidth || "",\n      };',
        ),
        (
            '    assert(initial.overflow <= 1, `${label}: initial horizontal overflow ${initial.overflow}px`);\n',
            '    assert(initial.overflow <= 1, `${label}: initial horizontal overflow ${initial.overflow}px`);\n    assert(initial.navBorderBlockEndWidth === "0px", `${label}: global site nav still has separator border ${initial.navBorderBlockEndWidth}`);\n',
        ),
        (
            '      const menuLinkStyle = firstMenuLink instanceof HTMLElement ? getComputedStyle(firstMenuLink) : null;\n',
            '      const menuLinkStyle = firstMenuLink instanceof HTMLElement ? getComputedStyle(firstMenuLink) : null;\n      const siteNavStyle = siteNav instanceof HTMLElement ? getComputedStyle(siteNav) : null;\n',
        ),
        (
            '        navHeight: navRect?.height ?? null,\n',
            '        navHeight: navRect?.height ?? null,\n        navBorderBlockEndWidth: siteNavStyle?.borderBlockEndWidth || siteNavStyle?.borderBottomWidth || "",\n',
        ),
        (
            '    assert(typeof opened.navHeight === "number" && opened.navHeight <= 1, `${label}: open site-nav still reserves ${opened.navHeight}px`);\n',
            '    assert(typeof opened.navHeight === "number" && opened.navHeight <= 1, `${label}: open site-nav still reserves ${opened.navHeight}px`);\n    assert(opened.navBorderBlockEndWidth === "0px", `${label}: open site nav still has separator border ${opened.navBorderBlockEndWidth}`);\n',
        ),
        (
            '      const toggleStyle = toggle instanceof HTMLElement ? getComputedStyle(toggle) : null;\n      return {',
            '      const toggleStyle = toggle instanceof HTMLElement ? getComputedStyle(toggle) : null;\n      const siteNav = document.querySelector(".site-nav");\n      const siteNavStyle = siteNav instanceof HTMLElement ? getComputedStyle(siteNav) : null;\n      return {',
        ),
        (
            '        togglePosition: toggleStyle?.position || "",\n      };',
            '        togglePosition: toggleStyle?.position || "",\n        navBorderBlockEndWidth: siteNavStyle?.borderBlockEndWidth || siteNavStyle?.borderBottomWidth || "",\n      };',
        ),
        (
            '    assert(closed.togglePosition !== "fixed", `${label}: closed Awfulface stayed detached from the normal header`);\n',
            '    assert(closed.togglePosition !== "fixed", `${label}: closed Awfulface stayed detached from the normal header`);\n    assert(closed.navBorderBlockEndWidth === "0px", `${label}: closed site nav restored a separator border ${closed.navBorderBlockEndWidth}`);\n',
        ),
    ]
    for old, new in replacements:
        if old not in source:
            raise SystemExit(f"smoke insertion point missing: {old[:80]!r}")
        source = source.replace(old, new, 1)
    smoke_path.write_text(source)

elif mode == "fix":
    path = Path("src/styles/components.css")
    source = path.read_text()
    pattern = re.compile(
        r'/\* ==================================================\n'
        r'   Portfolio navigation\n'
        r'   ================================================== \*/\n\n'
        r'\.site-nav \{.*?\n\}\n\n'
        r'\.site-nav__brand,\n\.site-nav__link \{.*?\n\}\n\n'
        r'\.site-nav__list \{.*?\n\}\n\n'
        r'(?=/\* One global project navigator)',
        re.S,
    )
    updated, count = pattern.subn("", source, count=1)
    if count != 1:
        raise SystemExit(f"expected exactly one legacy site-nav block, removed {count}")
    if re.search(r'(^|\n)\s*\.site-nav(?:\b|__)', updated):
        raise SystemExit("site-nav selector remains in components.css after cleanup")
    path.write_text(updated)

else:
    raise SystemExit("usage: tmp-nav-393-patch.py contracts|fix")
