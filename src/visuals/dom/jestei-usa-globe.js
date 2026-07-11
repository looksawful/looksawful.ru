const SELECTOR = "#jestei-usa-globe";
const D3_MODULE_URL = "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const TOPOJSON_MODULE_URL = "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
const GEO_DATA_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const AMERICAS = new Set([
  "Canada",
  "United States of America",
  "Mexico",
  "Greenland",
  "Belize",
  "Guatemala",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Costa Rica",
  "Panama",
  "Cuba",
  "Jamaica",
  "Haiti",
  "Dominican Rep.",
  "Bahamas",
  "Trinidad and Tobago",
  "Barbados",
  "Dominica",
  "Grenada",
  "Saint Lucia",
  "St. Vin. and Gren.",
  "Antigua and Barb.",
  "St. Kitts and Nevis",
  "Puerto Rico",
  "U.S. Virgin Is.",
  "British Virgin Is.",
  "Cayman Is.",
  "Turks and Caicos Is.",
  "Anguilla",
  "Montserrat",
  "Bermuda",
  "Colombia",
  "Venezuela",
  "Guyana",
  "Suriname",
  "Ecuador",
  "Peru",
  "Brazil",
  "Bolivia",
  "Paraguay",
  "Uruguay",
  "Argentina",
  "Chile",
  "Falkland Is.",
]);

const FINAL_ROTATION = [91, -13, 0];
const START_ROTATION = [108, -5, -5];
const FINAL_SCALE = 0.455;
const START_SCALE = 0.425;
const FINAL_X = 0.435;
const START_X = 0.485;
const FINAL_Y = 0.585;
const START_Y = 0.545;
const DURATION = 1450;

let librariesPromise;
let topologyPromise;

function loadLibraries() {
  librariesPromise ||= Promise.all([
    import(/* @vite-ignore */ D3_MODULE_URL),
    import(/* @vite-ignore */ TOPOJSON_MODULE_URL),
  ]).then(([d3, topojson]) => ({ d3, topojson }));
  return librariesPromise;
}

function loadTopology(signal) {
  if (!topologyPromise) {
    topologyPromise = fetch(GEO_DATA_URL, { signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Jestei globe geodata request failed: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        topologyPromise = undefined;
        throw error;
      });
  }
  return topologyPromise;
}

async function mountGlobe(svgNode) {
  if (!(svgNode instanceof SVGElement) || svgNode.dataset.globeMounted === "true") {
    return () => {};
  }

  svgNode.dataset.globeMounted = "true";
  const abortController = new AbortController();
  const win = svgNode.ownerDocument.defaultView || window;
  let resizeObserver;
  let intersectionObserver;
  let animationFrame = 0;
  let disposed = false;

  try {
    const [{ d3, topojson }, topology] = await Promise.all([
      loadLibraries(),
      loadTopology(abortController.signal),
    ]);

    if (disposed) return () => {};

    const features = topojson
      .feature(topology, topology.objects.countries)
      .features.filter((feature) => AMERICAS.has(feature.properties?.name));

    const svg = d3.select(svgNode);
    const card = svgNode.closest(".jestei-bento__card--usa");
    const reducedMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const staticMode = new URLSearchParams(win.location.search).has("static") || reducedMotion;

    let projection;
    let path;
    let width = 0;
    let height = 0;
    let hasAnimated = false;
    let currentRotation = staticMode ? FINAL_ROTATION : START_ROTATION;
    let currentScale = staticMode ? FINAL_SCALE : START_SCALE;
    let currentX = staticMode ? FINAL_X : START_X;
    let currentY = staticMode ? FINAL_Y : START_Y;

    function renderState(rotation, scaleFactor, xFactor, yFactor) {
      if (!projection || !path || disposed) return;

      currentRotation = rotation;
      currentScale = scaleFactor;
      currentX = xFactor;
      currentY = yFactor;

      projection
        .translate([width * xFactor, height * yFactor])
        .scale(Math.min(width, height) * scaleFactor)
        .rotate(rotation);

      svg.select(".graticule").attr("d", path);
      svg.select(".countries").selectAll("path").attr("d", path);
      svg.select(".sphere").attr("d", path);
    }

    function setupScene() {
      const rect = svgNode.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(260, rect.height);
      svg.attr("viewBox", `0 0 ${width} ${height}`);

      projection = d3.geoOrthographic().clipAngle(90).precision(0.12);
      path = d3.geoPath(projection);

      svg.selectAll("*").remove();
      svg.append("path").datum(d3.geoGraticule10()).attr("class", "graticule");

      svg
        .append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(features)
        .join("path")
        .attr("class", (feature) => (String(feature.id) === "840" ? "usa" : "country"));

      svg.append("path").datum({ type: "Sphere" }).attr("class", "sphere");

      renderState(currentRotation, currentScale, currentX, currentY);
    }

    function renderFinal() {
      win.cancelAnimationFrame(animationFrame);
      renderState(FINAL_ROTATION, FINAL_SCALE, FINAL_X, FINAL_Y);
    }

    function animateIn() {
      if (hasAnimated || staticMode || disposed) {
        renderFinal();
        return;
      }

      hasAnimated = true;
      win.cancelAnimationFrame(animationFrame);
      const startedAt = win.performance.now();
      const interpolateRotation = d3.interpolateArray(START_ROTATION, FINAL_ROTATION);

      function frame(now) {
        if (disposed) return;
        const raw = Math.min(1, (now - startedAt) / DURATION);
        const eased = d3.easeCubicOut(raw);
        const rotation = interpolateRotation(eased);
        const scale = START_SCALE + (FINAL_SCALE - START_SCALE) * eased;
        const x = START_X + (FINAL_X - START_X) * eased;
        const y = START_Y + (FINAL_Y - START_Y) * eased;

        renderState(rotation, scale, x, y);

        if (raw < 1) {
          animationFrame = win.requestAnimationFrame(frame);
        } else {
          renderFinal();
        }
      }

      animationFrame = win.requestAnimationFrame(frame);
    }

    setupScene();

    if (staticMode) {
      renderFinal();
    } else if ("IntersectionObserver" in win) {
      intersectionObserver = new win.IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            animateIn();
            intersectionObserver?.disconnect();
          }
        },
        { threshold: 0.28, rootMargin: "0px 0px -6% 0px" },
      );
      intersectionObserver.observe(card || svgNode);
    } else {
      animateIn();
    }

    if ("ResizeObserver" in win) {
      resizeObserver = new win.ResizeObserver(() => {
        setupScene();
        if (hasAnimated || staticMode) renderFinal();
      });
      resizeObserver.observe(svgNode.parentElement || svgNode);
    } else {
      win.addEventListener("resize", setupScene, { passive: true });
    }

    return () => {
      disposed = true;
      abortController.abort();
      win.cancelAnimationFrame(animationFrame);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      win.removeEventListener("resize", setupScene);
      svg.selectAll("*").remove();
      delete svgNode.dataset.globeMounted;
    };
  } catch (error) {
    delete svgNode.dataset.globeMounted;
    if (error?.name !== "AbortError") {
      console.error("[jestei usa globe] failed to mount", error);
    }
    return () => {};
  }
}

export async function mountJesteiUsaGlobe(root = document) {
  const disposers = await Promise.all(
    [...root.querySelectorAll(SELECTOR)].map((svgNode) => mountGlobe(svgNode)),
  );

  return () => {
    disposers.forEach((dispose) => dispose?.());
  };
}
