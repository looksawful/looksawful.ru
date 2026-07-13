# Jestei Desktop Reference QA

final result: passed

Scope:
- Jestei results, words, logo/sign, and color sections aligned to the supplied desktop screenshots.
- Jestei results bento refined against the latest supplied desktop screenshot: uneven top/lower grid widths, text measures, vertical process diagram, USA globe, and the audience portrait badge position.
- Previous hidden sections remain in the DOM but are not visible in the desktop reading order.
- Logo 3D middle card uses a static reference asset captured from the existing WebGL render so full-page screenshots and production load are deterministic.

Verification:
- `npm run build` completed successfully.
- Playwright screenshots verified `#jestei-results` at 1858px and 1280px widths.
- The audience portrait badge now uses a transparent outer background and a clamped desktop size so it stays attached to the right-card junction without covering text at the lower desktop breakpoint.
- Three Playwright desktop passes at 1800px verified visible order: `jestei-results`, `jestei-words`, `jestei-logo`, `jestei-color`.
- The same passes verified hidden `#jestei-type`, loaded logo thumbnails, loaded 3D sign reference image, portrait badge, and words metrics text.

Notes:
- Vite still reports the existing large chunk warning. It is not caused by this change and does not block the build.
