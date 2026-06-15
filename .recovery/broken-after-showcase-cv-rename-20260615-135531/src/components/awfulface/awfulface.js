const SVG_NS = "http://www.w3.org/2000/svg";
const FACE_SIZE = 400;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const POINTER_QUERY = "(hover: hover) and (pointer: fine)";

const EYES = {
  left: { x: -62, y: -8 },
  right: { x: 26, y: -24 },
};

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);

  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, String(value));
  });

  return el;
}

function createLine(attrs = {}) {
  return svgEl("path", {
    stroke: "#222222",
    "stroke-width": "9",
    fill: "none",
    ...attrs,
  });
}

function createFaceSvg() {
  const svg = svgEl("svg", {
    width: FACE_SIZE,
    height: FACE_SIZE,
    viewBox: "-200 -200 400 400",
    "aria-hidden": "true",
    focusable: "false",
  });

  const root = svgEl("g", { "data-awfulface-root": "" });

  const leftEye = svgEl("ellipse", {
    cx: EYES.left.x,
    cy: EYES.left.y,
    rx: "7",
    ry: "5",
    fill: "#222222",
  });

  const rightEye = svgEl("ellipse", {
    cx: EYES.right.x,
    cy: EYES.right.y,
    rx: "7",
    ry: "5",
    fill: "#222222",
  });

  const dashGroup = svgEl("g", { transform: "translate(-20 5)" });
  dashGroup.appendChild(createLine({ d: "M -5 62 L 30 82" }));

  const shapes = [
    {
      name: "left-eye",
      node: leftEye,
    },
    {
      name: "right-eye",
      node: rightEye,
    },
    {
      name: "brow",
      node: createLine({ d: "M -25 -28 L 30 -65" }),
    },
    {
      name: "dash",
      node: dashGroup,
    },
    {
      name: "nose",
      node: createLine({
        d: "M -75 -48 Q -30 -45 -25 -32 Q -20 0 -20 -5 Q -20 15 -5 7 Q 15 -10 1 0",
        "stroke-linejoin": "round",
      }),
    },
    {
      name: "mouth",
      node: createLine({
        d: "M -60 55 Q -35 27 -20 48 Q -15 70 10 35 Q 22 32 35 48 Q 55 42 50 46",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    },
  ];

  const parts = shapes.map(({ name, node }) => {
    const part = svgEl("g", { "data-awfulface-part": name });
    part.appendChild(node);
    root.appendChild(part);
    return part;
  });

  svg.appendChild(root);

  return {
    svg,
    parts,
    eyes: {
      left: leftEye,
      right: rightEye,
    },
  };
}

function canTrackPointer({ isInline }) {
  return (
    !isInline &&
    !window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches &&
    (window.matchMedia?.(POINTER_QUERY)?.matches ?? false)
  );
}

function resetEyes(eyes) {
  eyes.left.setAttribute("cx", EYES.left.x);
  eyes.left.setAttribute("cy", EYES.left.y);
  eyes.right.setAttribute("cx", EYES.right.x);
  eyes.right.setAttribute("cy", EYES.right.y);
}

function isInViewport(svg) {
  const rect = svg.getBoundingClientRect();

  return rect.bottom > 0 && rect.top < window.innerHeight;
}

function updateEyes({ svg, eyes, pointer, eyeStrength }) {
  const rect = svg.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const pointerX = ((pointer.clientX - rect.left) / rect.width) * FACE_SIZE - FACE_SIZE / 2;
  const pointerY = ((pointer.clientY - rect.top) / rect.height) * FACE_SIZE - FACE_SIZE / 2;

  eyes.left.setAttribute("cx", EYES.left.x + ((pointerX - EYES.left.x) / 200) * eyeStrength);
  eyes.left.setAttribute("cy", EYES.left.y + ((pointerY - EYES.left.y) / 200) * eyeStrength);

  eyes.right.setAttribute("cx", EYES.right.x + ((pointerX - EYES.right.x) / 200) * eyeStrength);
  eyes.right.setAttribute("cy", EYES.right.y + ((pointerY - EYES.right.y) / 200) * 0.5 * eyeStrength);
}

export function mountawfulface(
  containerId = "awfulface",
  { eyeStrength = 1, variant = "hero" } = {},
) {
  const container = document.getElementById(containerId);

  if (!container || container.dataset.awfulfaceMounted === "true") {
    return null;
  }

  const isInline = variant === "inline";
  const { svg, eyes } = createFaceSvg();

  container.dataset.awfulfaceMounted = "true";
  container.classList.add(
    "awfulface-container",
    isInline ? "awfulface-container--inline" : "awfulface-container--hero",
  );
  container.appendChild(svg);

  let frame = 0;
  let lastPointer = null;

  const resetPointer = () => {
    lastPointer = null;

    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    resetEyes(eyes);
  };

  const handlePointerMove = (event) => {
    if (!isInViewport(svg)) {
      resetPointer();
      return;
    }

    lastPointer = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(() => {
      frame = 0;

      if (lastPointer && isInViewport(svg)) {
        updateEyes({ svg, eyes, pointer: lastPointer, eyeStrength });
      }
    });
  };

  const handlePointerOut = (event) => {
    if (!event.relatedTarget) {
      resetPointer();
    }
  };

  const handleScroll = () => {
    if (!isInViewport(svg)) {
      resetPointer();
    }
  };

  const trackPointer = canTrackPointer({ isInline });

  if (trackPointer) {
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("blur", resetPointer);
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  resetEyes(eyes);

  return function destroyAwfulface() {
    if (frame) {
      window.cancelAnimationFrame(frame);
    }

    if (trackPointer) {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("blur", resetPointer);
      window.removeEventListener("scroll", handleScroll);
    }

    svg.remove();
    delete container.dataset.awfulfaceMounted;
  };
}
