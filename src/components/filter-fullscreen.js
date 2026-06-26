

function tryLockLandscape() {
  try {
    if (screen.orientation?.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }
  } catch (_) {
  }
}

function tryUnlockOrientation() {
  try {
    if (screen.orientation?.unlock) {
      screen.orientation.unlock();
    }
  } catch (_) {}
}

function isMobileViewport() {
  return window.innerWidth < 768 || window.innerHeight < 500;
}

export function initFilterFullscreen(root = document) {
  const buttons = root.querySelectorAll("[data-filter-fullscreen]");

  buttons.forEach((btn) => {
    const wrapper = btn.closest(".filter-fullscreen-wrapper");
    if (!(wrapper instanceof HTMLElement)) return;
    btn.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await wrapper.requestFullscreen({ navigationUI: "hide" });
          if (isMobileViewport()) {
            tryLockLandscape();
          }
        } else {
          tryUnlockOrientation();
          await document.exitFullscreen();
        }
      } catch (_) {
      }
    });
    const onFullscreenChange = () => {
      const isFs = document.fullscreenElement === wrapper;
      btn.setAttribute("aria-label", isFs ? "свернуть фильтр" : "фильтр на весь экран");
      btn.setAttribute("aria-pressed", String(isFs));
      wrapper.classList.toggle("is-fullscreen", isFs);
      if (!isFs) {
        tryUnlockOrientation();
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  });
}

