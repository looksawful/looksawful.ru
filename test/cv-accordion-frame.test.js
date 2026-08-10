import test from "node:test";
import assert from "node:assert/strict";

import {
  computeAccordionFrame,
  createAccordionFrameBuffer,
  createScrollMap,
} from "../src/components/cv-accordion/cv-accordion-frame.js";

test("accordion frame reuses its typed-array buffers", () => {
  const map = createScrollMap({
    count: 3,
    baseDistance: 900,
    contentTravels: [240, 360, 0],
  });
  const frame = createAccordionFrameBuffer(3);
  const identities = {
    headerPresences: frame.headerPresences,
    headerSizes: frame.headerSizes,
    panelHeights: frame.panelHeights,
    panelViewportSizes: frame.panelViewportSizes,
    activities: frame.activities,
    contentOffsets: frame.contentOffsets,
  };

  const first = computeAccordionFrame({
    offset: 120,
    map,
    listSize: 720,
    initialHeaderSize: 240,
    compactHeaderSize: 54,
    panelViewportSizes: [558, 558, 612],
    frame,
  });
  const second = computeAccordionFrame({
    offset: 510,
    map,
    listSize: 720,
    initialHeaderSize: 240,
    compactHeaderSize: 54,
    panelViewportSizes: [558, 558, 612],
    frame,
  });

  assert.strictEqual(first, frame);
  assert.strictEqual(second, frame);
  for (const [key, identity] of Object.entries(identities)) {
    assert.strictEqual(frame[key], identity, `${key} must be reused`);
  }
});

test("scroll map keeps O(1) content segment references by scene", () => {
  const map = createScrollMap({
    count: 4,
    baseDistance: 1200,
    contentTravels: [0, 320, 0, 480],
  });

  assert.equal(map.contentSegments.length, 4);
  assert.equal(map.contentSegments[0], null);
  assert.equal(map.contentSegments[1]?.type, "content");
  assert.equal(map.contentSegments[1]?.index, 1);
  assert.equal(map.contentSegments[2], null);
  assert.equal(map.contentSegments[3]?.index, 3);
});
