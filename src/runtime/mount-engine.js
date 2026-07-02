import { has, runAfterFirstPaint, runWhenIdle, runWhenNear, safe } from "./dom.js";

const PHASE_ORDER = ["critical", "content", "visual", "afterPaint", "idle", "near"];

function shouldRunMount(mount, root) {
  if (!mount.selector) {
    return true;
  }

  return has(mount.selector, root);
}

async function loadAndMount(mount, root) {
  const module = mount.load ? await mount.load() : null;

  if (typeof mount.mount === "function") {
    return mount.mount(module, root);
  }

  return module;
}

function runImmediateMount(mount, root) {
  return safe(mount.id, () => loadAndMount(mount, root));
}

function runNearMount(mount, root) {
  if (!mount.selector) {
    return runWhenIdle(() => {
      void runImmediateMount(mount, root);
    }, mount.idleTimeout || 1600);
  }

  return runWhenNear(
    mount.selector,
    mount.id,
    () => loadAndMount(mount, root),
    {
      root,
      rootMargin: mount.rootMargin || "900px 0px",
      threshold: mount.threshold || 0,
    },
  );
}

export async function mountAll(root = document, mounts = []) {
  const byPhase = new Map();

  mounts.forEach((mount) => {
    const phase = mount.phase || "content";
    if (!byPhase.has(phase)) {
      byPhase.set(phase, []);
    }
    byPhase.get(phase).push(mount);
  });

  for (const phase of PHASE_ORDER) {
    const phaseMounts = byPhase.get(phase) || [];

    if (phase === "near") {
      phaseMounts.filter((mount) => shouldRunMount(mount, root)).forEach((mount) => runNearMount(mount, root));
      continue;
    }

    if (phase === "idle") {
      phaseMounts.filter((mount) => shouldRunMount(mount, root)).forEach((mount) => {
        runWhenIdle(() => {
          void runImmediateMount(mount, root);
        }, mount.idleTimeout || 1600);
      });
      continue;
    }

    if (phase === "afterPaint") {
      phaseMounts.filter((mount) => shouldRunMount(mount, root)).forEach((mount) => {
        runAfterFirstPaint(() => {
          void runImmediateMount(mount, root);
        });
      });
      continue;
    }

    await Promise.allSettled(phaseMounts.filter((mount) => shouldRunMount(mount, root)).map((mount) => runImmediateMount(mount, root)));
  }
}