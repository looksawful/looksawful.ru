# Licensing model

## Decision

`looksawful.ru` uses a custom proprietary Portfolio Viewing License for material the repository owner is entitled to license and that is not already governed by a more specific license.

The repository is public for portfolio inspection, not because the project is intended to be open source. A permissive or source-available software license would grant rights that are intentionally not being granted here.

## Why a custom proprietary license

Without a repository license, default copyright already reserves reproduction, distribution and derivative-work rights. The explicit `LICENSE` exists to remove ambiguity about the portfolio-only purpose, define third-party and specific-license exclusions, and acknowledge the independent rights created by GitHub's public-repository Terms of Service.

The following common alternatives are intentionally not used as the repository-wide license:

- **MIT / BSD / Apache-2.0** — permit broad use, modification and redistribution.
- **GPL / AGPL / LGPL** — still grant use, modification and redistribution subject to copyleft conditions.
- **Creative Commons licenses** — are not a good blanket choice for a mixed software repository and still grant defined reuse rights; `BY-NC-ND` would also permit redistribution of unchanged material.
- **Business Source License and similar delayed-open models** — are designed around eventual or conditional reuse, which is not the stated goal.
- **PolyForm and similar source-available licenses** — grant categories of use that are broader than portfolio inspection.

The project therefore uses a custom all-rights-reserved license rather than pretending that public source visibility is the same thing as open source.

## Scope

| Material | Controlling terms |
| --- | --- |
| Owner-controlled original source code, design, text, documentation and media with no more specific license | Root `LICENSE` |
| File/directory/subproject/version with an explicit specific license | That specific license for the material/versions to which it applies |
| Third-party libraries and packages | Their upstream licenses; see `THIRD_PARTY_NOTICES.md` |
| Fonts and font software | Their font/package licenses, including OFL-1.1 where applicable |
| Client, employer, commissioner or collaborator material | The rights/agreements applicable to that material; never the root license by default |
| Logos, trademarks and product names | Their respective owners' trademark and related rights |
| External links, embeds and references | Rights remain with the external rightsholders |
| Material with unknown or unverified status | No redistribution clearance is assumed |

## Existing project-specific license exception

The current repository already contains a public declaration that **Awful Cases source code is licensed under the MIT License**, while its name, icon, visual identity and branding assets are expressly not licensed for branding reuse (`public/pets/awful-cases/index.html`).

The root `LICENSE` therefore does not attempt to retroactively erase that declaration. Issue #548 tracks the evidence needed to decide whether future Awful Cases versions can and should be relicensed prospectively. Earlier copies/versions already distributed under an applicable license must be treated according to the grant that applied to them.

## GitHub public-repository boundary

GitHub's Terms of Service grant GitHub and other GitHub users rights that apply independently of the root repository license. Under the Terms effective 27 April 2026, making a repository public permits other users to view it and fork/reproduce the content through GitHub's Service. The root license cannot cancel those platform grants; it only avoids granting additional reuse rights beyond them and applicable law.

The same current Terms grant GitHub and its Affiliates rights to store, host, archive, parse, display and copy public content for operating, developing and improving the Service, including stated AI/ML training and development purposes. A repository-level "no AI training" clause therefore cannot honestly be described as an absolute restriction against GitHub's own uses while the repository remains hosted publicly under those Terms. The root license instead states that this repository grants no *additional* AI-training/scraping permission beyond binding platform terms or applicable law.

GitHub also requires repository owners to have the right to post third-party content under terms compatible with GitHub's public-repository functionality. That is why content-rights verification is maintained separately from software licensing.

Primary references:

- GitHub licensing guidance: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository
- GitHub Terms of Service: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- npm `package.json` license metadata: https://docs.npmjs.com/files/package.json/

## Package metadata

The root package remains `private: true` and uses:

```json
"license": "SEE LICENSE IN LICENSE"
```

This is npm's supported form for a custom license that has no SPDX identifier. It describes the root package only; it does not replace the licenses of dependencies or project-specific license grants.

## Third-party compliance

`THIRD_PARTY_NOTICES.md` is the human-readable inventory of direct dependencies, known externally served resources and fonts.

Vite is configured to emit a build-time bundled-dependency license report. That generated report is evidence about dependencies actually included in a build and supplements, rather than replaces, upstream license files and notices.

## Content rights are separate from code licensing

A portfolio can contain work whose display is permitted while copyright ownership, redistribution rights or sublicensing rights remain elsewhere. Publication permission, ownership and permission to license to third parties are separate questions.

The classification rules and maintenance process live in `docs/RIGHTS_AND_PROVENANCE.md`. Asset-level verification remains a separate audit because Git history, file presence and public availability are not reliable evidence of ownership.

## Change rules

Review this licensing layer when any of the following changes:

- a direct dependency is added, removed or relicensed;
- a new font, CDN or externally served asset is introduced;
- a new client/collaborator/third-party media group becomes public;
- code or assets are copied or substantially adapted from an external source;
- an explicit file/subproject license is added, removed or changed;
- the repository's visibility or hosting platform changes; or
- GitHub materially changes the public-repository rights relevant to this model.

Commercial/private course material is not published or reproduced as an acknowledgement. Public technical references are tracked separately in `docs/REFERENCES.md`.