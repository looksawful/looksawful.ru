# CMS standalone Project ownership

This document records the first safe Stage 6 standalone Project slice.

## Shared rule

Pages CMS owns editorial copy only. A CMS edit must not create or change a route, discovery state, taxonomy relationship, renderer, media identity, presentation option or runtime configuration.

All three current standalone Project pages remain direct-link-only and `noindex` through the code-owned page manifest.

## Berry Agency

CMS source:

```text
src/content/standalone-projects/berry-social-content-2020.json
```

CMS-owned fields:

```text
head
title
role
period
summary
lead
```

Code-owned:

- stable Project ID `berry-social-content-2020`;
- route `/work/berry-social-content-2020/`;
- `listed: false` / `indexable: false`;
- client, engagement, role and project-type relationships;
- four existing mobile mockup media entries;
- device, theme, caption and loading presentation settings;
- renderer and layout.

## Awful Cases

CMS source:

```text
src/content/standalone-projects/awful-cases.json
```

CMS-owned fields:

```text
head
title
role
period
summary
lead
```

The validated source also feeds the matching catalog `name`, `date`, `summary` and `description`, eliminating duplicate authored copy.

Code-owned:

- stable Project ID `awful-cases`;
- route `/work/awful-cases/`;
- `listed: false` / `indexable: false`;
- engagement and role taxonomy;
- GitHub and ZIP links;
- demo-video media identity and video options;
- settings mockup media identity and presentation;
- renderer and layout.

## Moves Awful

CMS source:

```text
src/content/standalone-projects/moves-awful.json
```

CMS-owned fields:

```text
intro.head
intro.title
intro.role
intro.period
intro.summary
animations.title
animations.paragraphs[]
```

The validated intro source also feeds the matching catalog `name`, `date` and `summary`.

Code-owned:

- stable Project ID `moves-awful`;
- route `/work/moves-awful/`;
- `listed: false` / `indexable: false`;
- collection, engagement and role taxonomy;
- all three landing animation video entries and their video options;
- 16-item canvas gallery media list;
- canvas profile, variant, DOM ID and class name;
- renderer, layout and runtime.

## Validation contract

Each CMS source has a strict adapter that rejects unexpected keys and invalid required copy. Tests verify both directions:

1. current CMS values reach the existing rendered output and matching catalog fields;
2. route/discovery, media, links, taxonomy and runtime stay unchanged and are absent from Pages CMS fields.

Valid future editorial changes are read from the current JSON in tests rather than frozen as literal copy fixtures.
