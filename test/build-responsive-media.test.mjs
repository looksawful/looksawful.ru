import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getVariantWidths,
  isExcludedOffset,
  collectExcludedRanges,
  addResponsiveAttributes,
  getResponsiveUrl,
} from '../tools/build-responsive-media.mjs';

test('variant widths never upscale and skip negligible tiny derivatives', () => {
  assert.deepEqual(getVariantWidths(323), []);
  assert.deepEqual(getVariantWidths(823), [480]);
  assert.deepEqual(getVariantWidths(2974), [480, 960, 1600]);
});

test('comments and disabled templates are excluded', () => {
  const html = `
    <!-- <img src="./media/comment.webp"> -->
    <img src="./media/live.webp">
    <template data-disabled-section="before-after">
      <img src="./media/disabled.webp">
    </template>
  `;
  const ranges = collectExcludedRanges(html);
  const liveOffset = html.indexOf('<img src="./media/live.webp">');
  const disabledOffset = html.indexOf('<img src="./media/disabled.webp">');
  const commentOffset = html.indexOf('<img src="./media/comment.webp">');
  assert.equal(isExcludedOffset(liveOffset, ranges), false);
  assert.equal(isExcludedOffset(disabledOffset, ranges), true);
  assert.equal(isExcludedOffset(commentOffset, ranges), true);
});

test('responsive attributes preserve the original src', () => {
  const tag = '<img loading="lazy" src="./media/projects/a/source/photo.webp" width="1200" height="800">';
  const result = addResponsiveAttributes(tag, {
    srcset: '/media-responsive/projects/a/source/photo-480.webp 480w, ./media/projects/a/source/photo.webp 1200w',
    sizes: 'auto, 100vw',
  });
  assert.match(result, /src="\.\/media\/projects\/a\/source\/photo\.webp"/);
  assert.match(result, /srcset="\/media-responsive\/projects\/a\/source\/photo-480\.webp 480w, \.\/media\/projects\/a\/source\/photo\.webp 1200w"/);
  assert.match(result, /sizes="auto, 100vw"/);
});

test('responsive URL mirrors the existing media hierarchy', () => {
  assert.equal(
    getResponsiveUrl('./media/projects/jestei/01/source/01-823x419.webp', 480),
    '/media-responsive/projects/jestei/01/source/01-823x419-480.webp',
  );
});
