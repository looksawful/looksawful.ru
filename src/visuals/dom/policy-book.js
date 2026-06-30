const POLICY_BOOK_SELECTOR = "[data-policy-book]";
const READY_ATTRIBUTE = "policyBookReady";

function initPolicyBook(book) {
  if (!(book instanceof HTMLElement) || book.dataset[READY_ATTRIBUTE] === "true") {
    return;
  }

  const track = book.querySelector("[data-policy-track]");
  const pages = [...book.querySelectorAll("[data-policy-page]:not([hidden]):not([data-policy-hidden='true'])")];
  const prevButton = book.querySelector("[data-policy-prev]");
  const nextButton = book.querySelector("[data-policy-next]");
  const currentCounters = [...book.querySelectorAll("[data-policy-current]")];
  const totalCounters = [...book.querySelectorAll("[data-policy-total]")];
  const titleNode = book.querySelector("[data-policy-page-title]");
  const viewport = book.querySelector("[data-policy-viewport]");

  if (!(track instanceof HTMLElement) || !pages.length) {
    return;
  }

  book.dataset[READY_ATTRIBUTE] = "true";

  let currentIndex = 0;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let isPointerDown = false;
  let didDrag = false;

  totalCounters.forEach((node) => {
    node.textContent = String(pages.length).padStart(2, "0");
  });

  function update() {
    track.style.transform = "translate3d(" + String(-currentIndex * 100) + "%, 0, 0)";

    currentCounters.forEach((node) => {
      node.textContent = String(currentIndex + 1).padStart(2, "0");
    });

    if (titleNode) {
      titleNode.textContent = pages[currentIndex].getAttribute("data-policy-title") || "";
    }

    if (prevButton instanceof HTMLButtonElement) {
      prevButton.disabled = currentIndex === 0;
    }

    if (nextButton instanceof HTMLButtonElement) {
      nextButton.disabled = currentIndex === pages.length - 1;
    }
  }

  function goToPage(index) {
    currentIndex = Math.max(0, Math.min(index, pages.length - 1));
    pages[currentIndex].scrollTop = 0;
    update();
  }

  if (prevButton instanceof HTMLButtonElement) {
    prevButton.addEventListener("click", () => {
      goToPage(currentIndex - 1);
    });
  }

  if (nextButton instanceof HTMLButtonElement) {
    nextButton.addEventListener("click", () => {
      goToPage(currentIndex + 1);
    });
  }

  book.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      goToPage(currentIndex - 1);
    }

    if (event.key === "ArrowRight") {
      goToPage(currentIndex + 1);
    }
  });

  if (viewport instanceof HTMLElement) {
    viewport.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest("a, button, input, textarea, select, table")) {
        return;
      }

      isPointerDown = true;
      didDrag = false;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      viewport.setPointerCapture?.(event.pointerId);
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!isPointerDown) {
        return;
      }

      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;

      if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.08) {
        didDrag = true;
        event.preventDefault();
      }
    }, { passive: false });

    viewport.addEventListener("pointerup", (event) => {
      if (!isPointerDown) {
        return;
      }

      isPointerDown = false;
      viewport.releasePointerCapture?.(event.pointerId);

      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;

      if (didDrag && Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy) * 1.08) {
        goToPage(currentIndex + (dx < 0 ? 1 : -1));
      }
    });

    viewport.addEventListener("pointercancel", () => {
      isPointerDown = false;
      didDrag = false;
    });
  }

  const hashIndex = pages.findIndex((page) => page.id && "#" + page.id === window.location.hash);

  if (hashIndex >= 0) {
    currentIndex = hashIndex;
  }

  update();

  requestAnimationFrame(() => {
    update();
    book.classList.add("is-ready");
  });
}

export function initPolicyBooks(scope = document) {
  scope.querySelectorAll(POLICY_BOOK_SELECTOR).forEach(initPolicyBook);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initPolicyBooks();
  });
} else {
  initPolicyBooks();
}
