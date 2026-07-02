# common style candidates

strict rule: if there is any override risk, keep local.

| candidate | files/sections | exact same? | can change independently? | override risk? | decision | reason |
| --- | --- | --- | --- | --- | --- | --- |
| box-sizing reset | base/reset.css | yes | no | no | move to base | raw reset; not section composition |
| font-family | base/typography.css | yes | rarely | low | move to base | site-wide font default only |
| raw color tokens | base/tokens.css | yes | no | no | move to base | values only; section usage stays local |
| raw radius tokens | base/tokens.css | yes | no | no | move to base | values only; not component shape |
| raw shadow tokens | base/tokens.css | yes | no | no | move to base | values only; section decides when to use |
| visually-hidden | base/accessibility | yes | no | no | move to base | accessibility utility |
| focus-visible | base/interaction | mostly | maybe | medium | move to base only if generic | component-specific focus rings stay local |
| section title | all sections | no | yes | high | keep local | headings differ by section |
| section lead | all sections | no | yes | high | keep local | width, position and rhythm differ |
| media grid | media sections | no | yes | high | keep local | gallery compositions differ |
| pet cards | berserk/awful-cases/awful-audit | no | yes | high | keep local | each pet is its own section |
| token cards | jestei-color | no | yes | high | keep local | only color section owns this pattern |
| policy book | jestei-words | yes as component | yes shell only | medium | move internals to component, shell local | interactive component can be shared; placement stays local |
| playlist filter | jestei-filter | yes as component | yes shell only | medium | keep internals, shell local | filter internals are external component; section controls placement |
| site header | global | yes | no | low | move to component | not a showcase section |

## result
Do not create .section-title, .section-lead, .media-grid, .project-card, .pet-card, .case-section, .content-section, .token-list, .gallery, or .rail as shared layout APIs.
