# About Page Production Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace only the hidden production `/about` page with the approved compact editorial prototype, remove the portrait placeholder, keep the long About prose hidden, and keep the page unlinked from the main site.

**Architecture:** Reuse the existing standalone About route (`about/index.html`) and existing stylesheet entry (`src/about.css`). Do not touch the homepage, global navigation, accordion runtime, global themes, or site-wide typography; About continues to import the existing Rubik and shared site styles.

**Tech Stack:** Static HTML, CSS, existing Vite/site style imports.

## Global Constraints

- Work on branch `prod`.
- Do not add a portrait/photo container.
- Do not add any link to `/about` from the homepage or site navigation.
- Keep the long About prose in markup but hidden.
- Use only text already present in the existing About page.
- Keep a white background and the compact, mobile-first editorial layout approved in the prototype.
- No new JavaScript, observers, animations, or runtime systems.

---

### Task 1: Replace About markup

**Files:**
- Modify: `about/index.html`

**Interfaces:**
- Consumes: existing `/src/about.css` stylesheet entry.
- Produces: standalone hidden About page markup using `.about`, `.intro`, `.skills-index`, `.experience`, and `.contact`.

- [ ] **Step 1: Verify the current About page differs from the approved compact markup**

Inspect `about/index.html` and confirm it still contains the previous capabilities/footer structure before replacement.

- [ ] **Step 2: Replace only `about/index.html`**

Use the approved prototype content, omit the portrait `<figure>`, preserve the long About copy inside a `hidden` section, and keep the skills/experience/contact content unchanged from the source About page.

- [ ] **Step 3: Verify markup requirements**

Confirm:
- no `intro__portrait` or portrait `<figure>` exists;
- the long copy section has `hidden` and `aria-hidden="true"`;
- `Экспертиза` and `Опыт работы` remain visible;
- no navigation block is added.

### Task 2: Replace About-specific styling

**Files:**
- Modify: `src/about.css`

**Interfaces:**
- Consumes: `@fontsource-variable/rubik/wght.css` and `./styles/index.css`.
- Produces: white, compact, mobile-first About presentation scoped under `.about-page`.

- [ ] **Step 1: Replace the legacy About layout rules**

Use the approved compact typography: modest intro title, thin rules, numbered skill index, compact experience table, and horizontal multi-row skills rail on small screens.

- [ ] **Step 2: Keep site-owned systems intact**

Do not introduce a new font family, page theme, JS behavior, or global navigation styles.

- [ ] **Step 3: Verify CSS**

Confirm the file contains no portrait selectors and no rules that expose the hidden copy section.

### Task 3: Verify the page stays hidden from the homepage

**Files:**
- Read only unless a pre-existing homepage About link is found.

**Interfaces:**
- Consumes: repository-wide search for `/about` links.
- Produces: evidence that the main page/navigation does not expose About.

- [ ] **Step 1: Search repository links**

Search for `href="/about"`, `href="/about/"`, and equivalent About navigation references.

- [ ] **Step 2: Inspect any homepage/navigation hits**

If no homepage/navigation link exists, make no changes. If one exists, remove only that link without altering global navigation logic.

- [ ] **Step 3: Re-fetch production files**

Read `about/index.html` and `src/about.css` from `prod` and verify the final production state matches all constraints.
