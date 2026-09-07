# Licensing model

## Decision

`looksawful.ru` uses the custom proprietary **LOOKSAWFUL PORTFOLIO LICENSE, Version 1.0** for material Ivan Krushinsky owns or controls and that is not governed by a more specific license.

Machine-readable custom identifier: `LicenseRef-Looksawful-Portfolio-1.0`.

The repository is public for portfolio inspection, not because the project is intended to be open source. Public source visibility is not a general reuse grant.

## Why a custom proprietary license

Without an explicit repository license, copyright law already reserves many reproduction, distribution and adaptation rights. The explicit License exists to remove ambiguity about the portfolio-only purpose, define a narrow viewing permission, reserve reuse and machine-processing rights where legally available, identify exclusions, and acknowledge the independent rights created by platform terms such as GitHub's Terms of Service.

The following common alternatives are intentionally not used as the repository-wide license:

- **MIT / BSD / Apache-2.0** — permit broad use, modification and redistribution.
- **GPL / AGPL / LGPL** — still grant use, modification and redistribution subject to copyleft conditions.
- **Creative Commons licenses** — are not a good blanket choice for a mixed software/content repository and still grant defined reuse rights; `BY-NC-ND` would also permit redistribution of unchanged material.
- **Business Source License and delayed-open models** — are designed around eventual or conditional reuse.
- **PolyForm and similar source-available licenses** — grant categories of use broader than portfolio inspection.

The project therefore uses a custom All Rights Reserved portfolio license rather than treating source visibility as open-source permission.

## Scope

| Material | Controlling terms |
| --- | --- |
| Owner-controlled original source code, design, text, documentation and media with no more specific license | Root `LICENSE` / `LicenseRef-Looksawful-Portfolio-1.0` |
| File/directory/subproject/version with an explicit specific license | That specific license for the material/versions to which it applies |
| Third-party libraries and packages | Their upstream licenses; see `THIRD_PARTY_NOTICES.md` |
| Fonts and font software | Their font/package licenses; never the root License by default |
| Client, employer, commissioner or collaborator material | The rights/agreements applicable to that material |
| Logos, trademarks and product names | Their respective owners' trademark and related rights |
| Names, likenesses, voices and performances | Applicable consent, personality/privacy/performance rights and law |
| External links, embeds and references | Rights remain with the external rightsholders |
| Generated/AI-assisted material | Only rights actually recognized and controlled; third-party rights remain separate |
| Material with unknown or unverified status | No redistribution or sublicensing clearance is assumed |

`CONTENT_RIGHTS.md` contains the public-safe wording for these categories and for the major portfolio cases.

## Limited portfolio access

Version 1.0 grants only a narrow permission to access and view Owner-Controlled Material for personal portfolio evaluation, plus transient technical copies necessary for ordinary browser/service functionality.

It does not grant a general right to retain, reuse, redistribute, adapt, republish or incorporate the material elsewhere.

## Text and data mining / AI reservation

For rights the Licensor actually controls, Version 1.0 expressly reserves text-and-data-mining rights to the extent legally available, including under Article 4(3) of Directive (EU) 2019/790 and § 44b(3) UrhG.

For online-accessible works, § 44b(3) UrhG requires the reservation to be machine-readable. The legal text is therefore paired with website-level machine-readable signals rather than relying on a prose clause alone.

The project does **not** claim that a private license can eliminate mandatory or non-waivable statutory uses. In particular, scientific-research TDM under § 60d UrhG is a separate statutory regime whose application depends on its legal requirements.

Primary references:

- Directive (EU) 2019/790, Article 4: https://eur-lex.europa.eu/eli/dir/2019/790
- German Copyright Act, § 44b: https://www.gesetze-im-internet.de/urhg/__44b.html
- German Copyright Act, § 60d: https://www.gesetze-im-internet.de/urhg/__60d.html

## Machine-readable website signals

The website `robots.txt` should express the intended policy separately from the human-readable License:

- ordinary search indexing: allowed;
- AI input / RAG / generative-answer grounding: not permitted by the site policy;
- AI training / fine-tuning: not permitted by the site policy;
- broader stored/reproduced use: limited to reference-level use where the signal framework supports it.

Cloudflare Content Signals are a rights/preference signal, not a magical access-control wall. Crawler compliance is not universal, so technical bot controls should be used in addition to legal and machine-readable notices where available.

Primary reference: https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/

## GitHub public-repository boundary

GitHub's Terms of Service grant GitHub and other GitHub users rights that apply independently of the root License. Under the Terms effective 27 April 2026, making a repository public grants other users rights to view and reproduce it through GitHub's Service, including forking as permitted by GitHub functionality.

The same Terms grant GitHub and its Affiliates rights to store, host, archive, parse, display and copy public content for operating, developing and improving the Service, including rights expressly described for AI/ML training and development.

A repository-level "no AI training" clause therefore must not be described as overriding GitHub's own binding platform grant while the repository remains public there. Version 1.0 instead grants no **additional** AI-training or scraping rights beyond applicable law or binding platform terms.

GitHub also states that contributions to a repository containing a license are licensed under that repository license unless separate terms apply. Because this portfolio contains mixed-rights material, `CONTRIBUTING.md` rejects unsolicited content contributions by default.

Primary references:

- GitHub licensing guidance: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository
- GitHub Terms of Service: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service

## Existing project-specific license exception: Awful Cases

The standalone `looksawful/awful-cases` source repository contains a standard MIT License with `Copyright (c) 2026 Ivan Krushinsky`.

That MIT grant remains valid for the source/software material to which it applies. The root portfolio License does not retroactively revoke it.

Awful Cases branding is treated separately: the project name, icon, visual identity and branding assets are not assumed to be covered by the MIT software grant unless expressly stated.

## Third-party compliance

`THIRD_PARTY_NOTICES.md` is the human-readable inventory of direct dependencies, known externally served resources and fonts.

The upstream license always controls third-party material. A dependency's permissive license does not make this repository or portfolio content permissively licensed.

Vite is configured to emit a build-time bundled-dependency license report. That report supplements rather than replaces upstream LICENSE/NOTICE material.

## Font caution

Inter, Rubik, Golos Text and Press Start 2P are documented under their applicable font licenses.

The Pixelated MS Sans Serif resources referenced from the 98.css package require a stricter distinction: 98.css itself is MIT-licensed, but a package-level MIT declaration is not, by itself, conclusive evidence that historical Microsoft-derived font binaries, typeface rights or marks are safely relicensed under MIT. Their binary provenance should remain marked for verification.

## Package metadata

The root package remains `private: true` and uses:

```json
"license": "SEE LICENSE IN LICENSE"
```

This is an appropriate npm form for a custom license text. It describes the root package only; it does not override dependency, asset or subproject licenses.

## SPDX / REUSE

The canonical custom text is duplicated at:

`LICENSES/LicenseRef-Looksawful-Portfolio-1.0.txt`

This follows the `LicenseRef-*` mechanism used by SPDX-aware tooling for custom licenses.

A repository-wide `REUSE.toml` is **not** applied indiscriminately at this stage. REUSE annotations are powerful precisely because they assert file-level licensing. Assigning the proprietary License to broad paths before the mixed media/client/collaborator audit is complete would turn a compliance tool into a machine-readable false ownership claim, which would be a particularly elaborate way to make the documentation worse.

REUSE file-level annotations should be rolled out only to paths whose copyright and license status are sufficiently verified, with more-specific licenses taking precedence.

Primary reference: https://reuse.software/spec/

## Content rights are separate from code licensing

A portfolio can contain work whose public display is supported while copyright ownership, redistribution rights or sublicensing authority remains elsewhere.

For every rights-bearing asset group, answer separately:

1. May it be displayed publicly in the portfolio?
2. Who owns the relevant copyright or other right?
3. Does Ivan Krushinsky have authority to grant reuse rights to third parties?

A yes to the first question does not imply yes to the second or third.

The classification and evidence process lives in `docs/RIGHTS_AND_PROVENANCE.md`. Public wording lives in `CONTENT_RIGHTS.md`. Asset-level verification remains tracked by issue #546.

## Internal `reusable` field

The current media catalog has an internal boolean named `reusable`. It is a content-system field, not a public license flag.

Until the schema is renamed, `reusable: true` must be interpreted as **reusable within the portfolio/content system only**. It must never be treated as proof of copyright ownership, publication clearance, sublicensing authority or permission for external reuse.

A separate future schema should track legal rights explicitly.

## References and education

`docs/REFERENCES.md` records public technical learning/reference material only as provenance context.

A learning reference is not a claim that code was copied from the source. Copied or substantially adapted code must instead be documented with the exact source and applicable license.

Commercial/private course material should not be reproduced merely as an acknowledgement.

## Change rules

Review this licensing layer when any of the following changes:

- a direct dependency is added, removed or relicensed;
- a new font, CDN or externally served asset is introduced;
- a new client/collaborator/third-party media group becomes public;
- code or assets are copied or substantially adapted from an external source;
- an explicit file/subproject license is added, removed or changed;
- the repository's visibility or hosting platform changes;
- GitHub materially changes relevant public-repository Terms;
- EU/German TDM law or the machine-readable signaling strategy changes; or
- a rights-holder, client, collaborator or depicted person raises a rights or attribution issue.