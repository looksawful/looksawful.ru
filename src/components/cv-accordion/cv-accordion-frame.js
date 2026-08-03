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
  if (activeIndex < 0 || activeIndex >= count) {
    return false;
  }

  const end = Math.min(count, activeIndex + visibleHeaderCount);
  return index >= activeIndex && index < end;
}

function createCompactHeaderPresences({
  count,
  previousIndex,
  nextIndex,
  transition,
  visibleHeaderCount,
}) {
  return Array.from({ length: count }, (_, index) => {
    const previousPresence = isInHeaderWindow(
      index,
      previousIndex,
      count,
      visibleHeaderCount,
    )
      ? 1
      : 0;

    if (previousIndex === nextIndex) {
      return previousPresence;
    }

    const nextPresence = isInHeaderWindow(
      index,
      nextIndex,
      count,
      visibleHeaderCount,
    )
      ? 1
      : 0;

    return lerp(previousPresence, nextPresence, transition);
  });
}

export function createScrollMap({
  count,
  baseDistance,
  contentTravels = [],
  introRatio = DEFAULT_INTRO_RATIO,
} = {}) {
  const safeCount = Math.max(1, Math.trunc(toFiniteNumber(count, 1)));
  const safeBaseDistance = Math.max(1, toFiniteNumber(baseDistance, 1));
  const safeIntroRatio = clamp(
    toFiniteNumber(introRatio, DEFAULT_INTRO_RATIO),
    0.001,
    0.4,
  );
  const travels = Array.from({ length: safeCount }, (_, index) =>
    Math.max(0, toFiniteNumber(contentTravels[index], 0)),
  );

  const milestones = Array.from({ length: safeCount }, (_, index) =>
    safeCount === 1
      ? safeIntroRatio
      : safeIntroRatio + (index / (safeCount - 1)) * (1 - safeIntroRatio),
  );
  const anchors = Array.from({ length: safeCount }, () => 0);
  const segments = [];

  const introDistance = safeBaseDistance * safeIntroRatio;
  const transitionDistance =
    safeCount > 1
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
    segments.push({
      type: "hold",
      index: 0,
      progress: milestones[0],
      start: cursor,
      end: safeBaseDistance,
    });

    cursor = safeBaseDistance;
  }

  for (let index = 0; index < safeCount; index += 1) {
    const travel = travels[index];

    if (travel > 0) {
      segments.push({
        type: "content",
        index,
        progress: milestones[index],
        start: cursor,
        end: cursor + travel,
      });

      cursor += travel;
    }

    if (index === safeCount - 1) {
      continue;
    }

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
} = {}) {
  const totalDistance = Math.max(1, map?.totalDistance ?? 1);
  const safeOffset = clamp(toFiniteNumber(offset, 0), 0, totalDistance);

  let accordionProgress = 1;

  for (const segment of map?.segments ?? []) {
    if (safeOffset > segment.end) {
      continue;
    }

    const distance = Math.max(1, segment.end - segment.start);
    const localProgress = clamp((safeOffset - segment.start) / distance);

    if (segment.type === "content" || segment.type === "hold") {
      accordionProgress = segment.progress;
    } else {
      accordionProgress = lerp(
        segment.fromProgress,
        segment.toProgress,
        localProgress,
      );
    }

    break;
  }

  const count = Math.max(1, map?.count ?? 1);
  const safeListSize = Math.max(0, toFiniteNumber(listSize, 0));
  const safeInitialHeaderSize = Math.max(
    0,
    toFiniteNumber(initialHeaderSize, 0),
  );
  const safeCompactHeaderSize = Math.max(
    0,
    toFiniteNumber(compactHeaderSize, 0),
  );
  const safeVisibleHeaderCount = Math.max(
    1,
    Math.trunc(
      toFiniteNumber(visibleHeaderCount, DEFAULT_VISIBLE_HEADER_COUNT),
    ),
  );
  const introRatio = Math.max(0.001, map?.introRatio ?? DEFAULT_INTRO_RATIO);
  const introProgress = smoothstep(accordionProgress / introRatio);
  const cursor =
    clamp((accordionProgress - introRatio) / Math.max(0.001, 1 - introRatio)) *
    (count - 1);
  const previousIndex = Math.floor(cursor);
  const nextIndex = Math.min(count - 1, previousIndex + 1);
  const transition = smootherstep(cursor - previousIndex);
  const activities = Array.from({ length: count }, () => 0);

  activities[previousIndex] += (1 - transition) * introProgress;
  activities[nextIndex] += transition * introProgress;

  const compactHeaderPresences = createCompactHeaderPresences({
    count,
    previousIndex,
    nextIndex,
    transition,
    visibleHeaderCount: safeVisibleHeaderCount,
  });

  const headerPresences = compactHeaderPresences.map((presence) =>
    lerp(1, presence, introProgress),
  );
  const headerSizes = compactHeaderPresences.map((presence) =>
    lerp(
      safeInitialHeaderSize,
      safeCompactHeaderSize * presence,
      introProgress,
    ),
  );

  const occupiedHeaderSize = headerSizes.reduce(
    (total, size) => total + size,
    0,
  );
  const availablePanelSize = Math.max(0, safeListSize - occupiedHeaderSize);
  const activityTotal = activities.reduce(
    (total, activity) => total + activity,
    0,
  );
  const panelHeights = activities.map((activity) =>
    activityTotal > 0 ? availablePanelSize * (activity / activityTotal) : 0,
  );

  const normalizedPanelViewportSizes = Array.from(
    { length: count },
    (_, index) =>
      Math.max(0, toFiniteNumber(panelViewportSizes[index], availablePanelSize)),
  );

  const contentOffsets = (map?.contentTravels ?? []).map((travel, index) => {
    const segment = map.segments.find(
      (candidate) => candidate.type === "content" && candidate.index === index,
    );

    if (!segment) {
      return 0;
    }

    return clamp(safeOffset - segment.start, 0, travel);
  });

  return {
    progress: safeOffset / totalDistance,
    activeIndex: activities.indexOf(Math.max(...activities)),
    headerPresences,
    headerSizes,
    panelHeights,
    panelViewportSizes: normalizedPanelViewportSizes,
    activities,
    contentOffsets,
  };
}
