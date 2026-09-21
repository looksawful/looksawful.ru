# Looksawful.ru

Canonical glossary for project-specific domain language. This is a glossary, not a spec or implementation guide.

## Language

**Case**:
A portfolio case that presents one substantial body of work with its own identity, narrative and media.
_Avoid_: Project, when referring specifically to a Case entity.

**Collection**:
A curated set of related works presented as a grouped portfolio surface rather than one Case.

**Project card**:
A homepage/navigation presentation that points to a Case or another project surface; it is not the canonical identity of the destination.

**Site page**:
A canonical public page identity in the portfolio's routing/domain model.
_Avoid_: Route, when discussing the page entity rather than its URL mechanism.

**Media asset**:
A stable reusable visual or audiovisual item that can be placed in one or more portfolio surfaces.

**Media Catalog**:
The canonical catalog of reusable media identity and metadata used by the site.
_Avoid_: Media registry, when referring to the complete catalog concept.

**Registered asset**:
A Media Catalog asset whose stable identity originates in the typed registered-media set.

**Uploaded asset**:
A Media Catalog asset introduced through the validated CMS upload path.

**Placement**:
The use of a media asset in a specific page/case/collection context, where presentation-specific metadata can differ from catalog defaults.

**Source master**:
The preserved source-quality media file from which browser delivery derivatives may be produced.

**Delivery asset**:
A browser-facing optimized media file used for site delivery while the source master remains preserved.

**Editorial copy**:
Authored human-facing text that can be edited where an explicit editorial/CMS model exposes it.

**Visual review**:
A review of a rendered Case against its intended appearance across defined viewing contexts.

**Visual baseline**:
An explicitly approved reference rendering of a Case used to identify unintended visual changes.

**Affected Case**:
A Case whose rendered output may be changed by a change set, either directly or through shared site behavior.
_Avoid_: Affected project, when referring specifically to Case-level visual review.

**Viewport profile**:
A named viewing context representing a target device or display class for visual review.

**Review state**:
A deterministic visual state used to render a component or Case reproducibly during visual review.

**Motion profile**:
A visual-review context corresponding to the user's motion preference, such as normal motion or reduced motion.

**Motion-sensitive component**:
A component whose rendered appearance materially differs between motion profiles and therefore requires distinct visual-review states.

**Case review profile**:
The set of viewport, motion and review-state contexts required to review a Case without redundant duplicate states.

**Component review profile**:
The component-level visual-review contexts required only when a component has materially distinct visual states that cannot be represented by the Case's default state.

**Visual approval**:
An explicit human confirmation that the rendered review output for a specific Case and source SHA is acceptable.

**Baseline approval**:
The explicit act, performed only after Visual approval, of promoting that exact reviewed Case and source SHA to the canonical Visual baseline.

**Review surface**:
A user-facing way to inspect the rendered output of a Visual review, ranging from a quick derived preview to the exact immutable rendered Case.

**Review Hub**:
A persistent private Review surface that provides the fastest path to the current visual-review evidence for a Case.

**Review depth**:
The amount of evidence required for a Visual review, ranging from a quick derived preview to exact interactive and full cross-profile inspection.
