# Private Storybook preview reconciliation — 2026-09-30
Owners: #976 / #861 / #1118 / #1016. Base: dev 7549fb33.
Owner authorized GitHub publication and deployment to the private Storybook on 2026-09-30. Publication and exact-head deployment results are tracked in the owning issues.

Changes:
- Production-backed Live / ComingSoon Useful cards and responsive Useful composition.
- Screen selector for all 12 enabled entity compositions; canonical renderers/data/CSS.
- Fix missing Jestei specialized renderer in registry sections and full compositions.
- 11-model viewer using production runtime, view/autorotation controls and cleanup.
- Four devices use current Media Catalog. Seven equipment/environment GLBs restored from accepted Lab 6ceb21682daa891afd0c08ae81ebd53a88ebdbbc.
- Experimental iPhone #119 stays separate; this pass does not certify newer source acceptance.
- Fix overescaped GLB filename assertion in existing candidate identity contract.

Verification: typecheck PASS; isolated Lab shell build PASS; final static Storybook build PASS; 105/105 registry fixtures render; contracts 40 PASS / 3 SKIP / 0 FAIL.
Browser: initial matrix 46 PASS; final artifact matrix 25 PASS, including 11 desktop models and representative tablet/mobile coverage. No page errors or document-level horizontal overflow in the final matrix.
Inventory: 26 stories; 0 structural errors; 62 missing source classifications, not 62 necessarily missing visual components.
Limits: screen stories review layout/content; specialized interactions stay in focused runtime stories. Primitive implementation/adoption remains #1106/#1112–#1118.
Tests: NEW PERMANENT TESTS 0; TEMPORARY TESTS REMOVED 2; MOVED TO AFFECTED/FULL 0. KEEP existing candidate identity contract, corrected escaping.
Next: publish the reviewed diff, run configured exact-head CI, deploy the private Lab, then await owner review in Storybook.
