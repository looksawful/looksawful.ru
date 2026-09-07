# Rights and provenance

## Core rule

A file being present in this repository does not prove that the repository owner owns every right in it.

For licensing and redistribution decisions, rights are classified by evidence. When status is unknown or unverified, the default is **no redistribution clearance**. The material may remain visible as portfolio content while its publication basis is reviewed, but it must not be described as owner-controlled or sublicensable without evidence.

## Rights classes

### A — Owner-controlled original material

Examples: original source code, original interface implementation, original design work, original writing, original photography/3D/media where the owner actually controls the necessary rights.

Required evidence can include source files, authorship history, project records or other reasonable provenance showing that the material was created by or validly assigned/licensed to the repository owner.

Root `LICENSE` may apply.

### B — Collaborative or commissioned work

Examples: team design, photography with a separate photographer, styling, music, commissioned illustration, client production or work created within a shared project.

Portfolio display rights, copyright ownership and sublicensing rights must be considered separately. Credits do not transfer ownership. Root `LICENSE` does not apply to other contributors' material unless their rights were validly transferred or licensed for that purpose.

### C — Client, employer or commissioner material

Examples: client assets, product imagery, internal screenshots, supplied copy, brand systems or deliverables whose rights may belong to a client/employer/commissioner.

Do not infer ownership from authorship or from permission to show a case study. Root `LICENSE` does not grant reuse rights in this material.

### D — Third-party licensed material

Examples: libraries, fonts, stock assets, open-source code, icon sets, textures or other material used under a separate license.

The upstream license controls. Required notices and attribution must be preserved. See `THIRD_PARTY_NOTICES.md` for the current software/font inventory.

### E — Trademarks, logos and product identities

Brand names, marks and logos may be displayed to identify portfolio projects, but their presence does not transfer trademark rights. They remain controlled by their respective owners unless explicitly documented otherwise.

### F — Names, likenesses and performances

Portraits, models, performers, voices and identifiable people may involve privacy, publicity, model-release or contractual rights in addition to copyright. A photographer's copyright does not automatically settle those separate rights.

### G — External, embedded or linked material

A public URL, embed or externally hosted asset is not a license grant. The external rightsholder's terms control. Linking or embedding does not make the referenced material owner-controlled.

### H — Generated or synthetic material

Generated material must be tracked separately when its source model/service terms, training/source provenance, embedded third-party elements or client constraints could affect use. Generated status alone is not a guarantee of exclusive copyright or sublicensing rights.

### U — Unknown / unverified

Use this class whenever the evidence is incomplete, conflicting or unavailable. `U` means:

- do not claim ownership;
- do not include the material within the root proprietary license;
- do not grant redistribution rights;
- do not assume public availability is permission;
- create or retain an audit item until the status is resolved.

## Publication, ownership and sublicensing are separate

For every rights-bearing asset group, answer three different questions:

1. **May it be displayed publicly in this portfolio?**
2. **Who owns the relevant copyright or other rights?**
3. **Does the repository owner have authority to grant reuse rights to third parties?**

A `yes` to the first question does not imply `yes` to the second or third.

## Evidence hierarchy

Prefer evidence in this order when available:

1. explicit contract, assignment, license or permission record;
2. original source/master files plus project records establishing authorship;
3. authoritative client/collaborator credits and delivery records;
4. upstream license files/package metadata for third-party software/assets;
5. documented publication permission or portfolio-use agreement;
6. public metadata or repository history as supporting context only.

Git commit authorship, filenames, captions and public availability are supporting clues, not sufficient proof of ownership by themselves.

## Public documentation boundary

The public repository should record the classification and source/reference needed to understand a rights decision. It should not expose contracts, personal data, private correspondence, client secrets or confidential commercial terms.

Use internal records for sensitive evidence and expose only the minimum public note required for provenance and attribution.

## Asset-level audit

Canonical implementation/audit tracker: GitHub issue #546.

The audit should cover public material by project or coherent media group, not by blindly assigning the root license to every file.

For each group record:

- project/path;
- rights class (`A`–`H` or `U`);
- creator/rightsholder where publicly appropriate;
- source or provenance reference;
- portfolio publication basis: verified / assumed / unknown;
- redistribution/sublicensing authority: yes / no / unknown;
- attribution requirements;
- restrictions or follow-up;
- date last checked.

## Maintenance checklist

When adding or changing content:

- [ ] Classify every new public media/content group.
- [ ] Confirm that client/collaborator material is not accidentally described as owner-controlled.
- [ ] Preserve required credits and notices.
- [ ] Keep private evidence out of the public repository.
- [ ] Mark uncertain material `U` instead of guessing.
- [ ] Create a focused issue when an attribution or publication-right gap needs action.

When adding or changing code/dependencies:

- [ ] Check the upstream license before adoption.
- [ ] Update `THIRD_PARTY_NOTICES.md` for direct dependencies and externally served components.
- [ ] Preserve upstream LICENSE/NOTICE requirements.
- [ ] Record substantial copied/adapted public code in `docs/REFERENCES.md` or a more specific provenance file as appropriate.
- [ ] Verify that the root license is not being applied to third-party code.
- [ ] Confirm the build-generated dependency license report still exists.

When adding fonts or external assets:

- [ ] Record the font/asset license and source.
- [ ] Preserve OFL or other required license text/notices when files are redistributed.
- [ ] Distinguish a package wrapper's software license from the font's own license.
- [ ] Check whether remote/CDN use changes the distribution obligations.

## Review triggers

Revisit this document and the licensing inventory when:

- public project/media groups are added or replaced;
- credits materially change;
- a client/collaborator requests a rights or attribution change;
- a dependency/font changes license;
- copied/adapted external code is introduced;
- an asset moves from external embedding to repository-hosted distribution; or
- a rights conflict, takedown or uncertainty is discovered.

## Fail-closed rule

If the repository cannot establish authority to sublicense material, the repository documentation must not claim that authority. The safe state is exclusion from the root license plus an explicit unresolved audit record.