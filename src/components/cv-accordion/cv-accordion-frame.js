const DEFAULT_INTRO_RATIO = 0.075;
const DEFAULT_VISIBLE_HEADER_COUNT = 3;

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function smoothstep(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

function smootherstep(value) {
  const x = clamp(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isInHeaderWindow(index, activeIndex, count, visibleHeaderCount) {
  if (activeIndex < 0 || activeIndex >= count) return false;
  const end = Math.min(count, activeIndex + visibleHeaderCount);
  return index >= activeIndex && index < end;
}

export function createAccordionFrameBuffer(count = 1) {
  const safeCount = Math.max(1, Math.trunc(toFiniteNumber(count, 1)));
  return {
    progress: 0,
    activeIndex: -1,
    previousIndex: -1,
    nextIndex: -1,
    transition: 0,
    headerPresences: new Float64Array(safeCount),
    headerSizes: new Float64Array(safeCount),
    panelHeights: new Float64Array(safeCount),
    panelViewportSizes: new Float64Array(safeCount),
    activities: new Float64Array(safeCount),
    contentOffsets: new Float64Array(safeCount),
  };
}

export function createScrollMap({
  count,
  baseDistance,
  contentTravels = [],
  introRatio = DEFAULT_INTRO_RATIO,
} = {}) {
  const safeCount = Math.max(1, Math.trunc(toFiniteNumber(count, 1)));
  const safeBaseDistance = Math.max(1, toFiniteNumber(baseDistance, 1));
  const safeIntroRatio = clamp(toFiniteNumber(introRatio, DEFAULT_INTRO_RATIO), 0.001, 0.4);
  const travels = Array.from({ length: safeCount }, (_, index) =>
    Math.max(0, toFiniteNumber(contentTravels[index], 0)),
  );
  const milestones = Array.from({ length: safeCount }, (_, index) =>
    safeCount === 1
      ? safeIntroRatio
      : safeIntroRatio + (index / (safeCount - 1)) * (1 - safeIntroRatio),
  );
  const anchors = Array.from({ length: safeCount }, () => 0);
  const contentSegments = Array.from({ length: safeCount }, () => null);
  const segments = [];
  const introDistance = safeBaseDistance * safeIntroRatio;
  const transitionDistance = safeCount > 1
    ? (safeBaseDistance - introDistance) / (safeCount - 1)
    : 0;
  let cursor = 0;

  segments.push({
    type: "transition",
    fromIndex: -1,
    toIndex: 0,
    fromProgress: 0,
    toProgress: milestones[0],
    start: cursor,
    end: cursor + introDistance,
  });
  cursor += introDistance;
  anchors[0] = cursor;

  if (safeCount === 1 && cursor < safeBaseDistance) {
    segments.push({ type: "hold", index: 0, progress: milestones[0], start: cursor, end: safeBaseDistance });
    cursor = safeBaseDistance;
  }

  for (let index = 0; index < safeCount; index += 1) {
    const travel = travels[index];
    if (travel > 0) {
      const segment = { type: "content", index, progress: milestones[index], start: cursor, end: cursor + travel };
      segments.push(segment);
      contentSegments[index] = segment;
      cursor += travel;
    }
    if (index === safeCount - 1) continue;
    segments.push({
      type: "transition",
      fromIndex: index,
      toIndex: index + 1,
      fromProgress: milestones[index],
      toProgress: milestones[index + 1],
      start: cursor,
      end: cursor + transitionDistance,
    });
    cursor += transitionDistance;
    anchors[index + 1] = cursor;
  }

  return {
    count: safeCount,
    introRatio: safeIntroRatio,
    milestones,
    anchors,
    segments,
    contentSegments,
    contentTravels: travels,
    totalDistance: Math.max(1, cursor),
  };
}

export function computeAccordionFrame({
  offset,
  map,
  listSize,
  initialHeaderSize,
  compactHeaderSize,
  panelViewportSizes = [],
  visibleHeaderCount = DEFAULT_VISIBLE_HEADER_COUNT,
  frame = null,
} = {}) {
  const count = Math.max(1, map?.count ?? 1);
  const output = frame ?? createAccordionFrameBuffer(count);
  const totalDistance = Math.max(1, map?.totalDistance ?? 1);
  const safeOffset = clamp(toFiniteNumber(offset, 0), 0, totalDistance);

  let accordionProgress = 1;
  for (const segment of map?.segments ?? []) {
    if (safeOffset > segment.end) continue;
    const distance = Math.max(1, segment.end - segment.start);
    const localProgress = clamp((safeOffset - segment.start) / distance);
    accordionProgress = segment.type === "content" || segment.type === "hold"
      ? segment.progress
      : lerp(segment.fromProgress, segment.toProgress, localProgress);
    break;
  }

  const safeListSize = Math.max(0, toFiniteNumber(listSize, 0));
  const safeInitialHeaderSize = Math.max(0, toFiniteNumber(initialHeaderSize, 0));
  const safeCompactHeaderSize = Math.max(0, toFiniteNumber(compactHeaderSize, 0));
  const safeVisibleHeaderCount = Math.max(1, Math.trunc(toFiniteNumber(visibleHeaderCount, DEFAULT_VISIBLE_HEADER_COUNT)));
  const introRatio = Math.max(0.001, map?.introRatio ?? DEFAULT_INTRO_RATIO);
  const introProgress = smoothstep(accordionProgress / introRatio);
  const cursor = clamp((accordionProgress - introRatio) / Math.max(0.001, 1 - introRatio)) * (count - 1);
  const previousIndex = Math.floor(cursor);
  const nextIndex = Math.min(count - 1, previousIndex + 1);
  const transition = smootherstep(cursor - previousIndex);

  output.activities.fill(0);
  output.activities[previousIndex] += (1 - transition) * introProgress;
  output.activities[nextIndex] += transition * introProgress;

  let occupiedHeaderSize = 0;
  let strongestActivity = 0.001;
  let activeIndex = -1;

  for (let index = 0; index < count; index += 1) {
    const previousPresence = isInHeaderWindow(index, previousIndex, count, safeVisibleHeaderCount) ? 1 : 0;
    const nextPresence = isInHeaderWindow(index, nextIndex, count, safeVisibleHeaderCount) ? 1 : 0;
    const compactPresence = previousIndex === nextIndex
      ? previousPresence
      : lerp(previousPresence, nextPresence, transition);
    const headerPresence = lerp(1, compactPresence, introProgress);
    const headerSize = lerp(safeInitialHeaderSize, safeCompactHeaderSize * compactPresence, introProgress);
    output.headerPresences[index] = headerPresence;
    output.headerSizes[index] = headerSize;
    output.panelViewportSizes[index] = Math.max(0, toFiniteNumber(panelViewportSizes[index], 0));
    occupiedHeaderSize += headerSize;

    if (output.activities[index] > strongestActivity) {
      strongestActivity = output.activities[index];
      activeIndex = index;
    }
  }

  const availablePanelSize = Math.max(0, safeListSize - occupiedHeaderSize);
  const activityTotal = output.activities.reduce((total, activity) => total + activity, 0);

  for (let index = 0; index < count; index += 1) {
    const activity = output.activities[index];
    output.panelHeights[index] = activityTotal > 0
      ? availablePanelSize * (activity / activityTotal)
      : 0;
    const travel = map?.contentTravels?.[index] ?? 0;
    const segment = map?.contentSegments?.[index];
    output.contentOffsets[index] = segment
      ? clamp(safeOffset - segment.start, 0, travel)
      : 0;
  }

  output.progress = safeOffset / totalDistance;
  output.activeIndex = activeIndex;
  output.previousIndex = previousIndex;
  output.nextIndex = nextIndex;
  output.transition = transition;
  return output;
}
