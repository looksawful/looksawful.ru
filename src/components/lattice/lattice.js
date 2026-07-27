/*
 * Позволяет безопасно уничтожить предыдущий
 * экземпляр компонента при повторном mount.
 */
const LATTICE_DESTROY = Symbol.for("looksawful.lattice.destroy");

const noop = () => {};

/*
 * Возвращает все экземпляры Lattice
 * внутри переданного root.
 */
function getLatticeRoots(root) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return [];
  }

  const lattices = Array.from(root.querySelectorAll("[data-lattice]"));

  /*
   * root сам может являться Lattice.
   */
  if (root instanceof HTMLElement && root.matches("[data-lattice]")) {
    lattices.unshift(root);
  }

  return [...new Set(lattices)];
}

/*
 * Получает реальные цвета текущей темы
 * непосредственно из корня Lattice.
 */
function getCanvasColors(lattice) {
  const styles = getComputedStyle(lattice);

  return {
    background: styles.backgroundColor || "#111111",

    foreground: styles.color || "#e6e0d1",
  };
}

/*
 * Подготавливает canvas под фактический размер
 * элемента и плотность пикселей устройства.
 */
function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();

  const width = Math.max(1, rect.width);

  const height = Math.max(1, rect.height);

  /*
   * DPR ограничен двойным разрешением,
   * чтобы canvas не расходовал лишнюю память.
   */
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * pixelRatio);

  canvas.height = Math.round(height * pixelRatio);

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  context.clearRect(0, 0, width, height);

  return {
    context,
    width,
    height,
  };
}

/*
 * Canvas: концентрические окружности.
 */
function drawOrbit(context, width, height, foreground) {
  const centerX = width / 2;
  const centerY = height / 2;

  const maximumRadius = Math.min(width, height) * 0.42;

  context.strokeStyle = foreground;

  context.lineWidth = Math.max(2, width * 0.008);

  for (let index = 1; index <= 6; index += 1) {
    context.globalAlpha = 0.24 + index * 0.1;

    context.beginPath();

    context.arc(centerX, centerY, (maximumRadius / 6) * index, 0, Math.PI * 2);

    context.stroke();
  }

  context.globalAlpha = 1;

  context.fillStyle = foreground;

  context.beginPath();

  context.arc(centerX + maximumRadius * 0.56, centerY, width * 0.025, 0, Math.PI * 2);

  context.fill();
}

/*
 * Canvas: диагональная решётка.
 */
function drawGrid(context, width, height, foreground) {
  const step = Math.max(22, width / 8);

  context.strokeStyle = foreground;

  context.lineWidth = Math.max(1.5, width * 0.006);

  context.globalAlpha = 0.72;

  for (let offset = -height; offset < width + height; offset += step) {
    context.beginPath();

    context.moveTo(offset, 0);

    context.lineTo(offset - height, height);

    context.stroke();

    context.beginPath();

    context.moveTo(offset, 0);

    context.lineTo(offset + height, height);

    context.stroke();
  }

  context.globalAlpha = 1;
}

/*
 * Canvas: волны.
 */
function drawWaves(context, width, height, foreground) {
  context.strokeStyle = foreground;

  context.lineWidth = Math.max(2, width * 0.007);

  for (let row = 0; row < 7; row += 1) {
    const baseline = (height / 8) * (row + 1);

    const amplitude = height * 0.035 + row * 1.5;

    context.globalAlpha = 0.34 + row * 0.08;

    context.beginPath();

    for (let x = 0; x <= width; x += 4) {
      const y = baseline + Math.sin((x / width) * Math.PI * 4 + row * 0.55) * amplitude;

      if (x === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }

  context.globalAlpha = 1;
}

/*
 * Canvas: модульная сетка блоков.
 */
function drawBlocks(context, width, height, foreground) {
  const columns = 5;
  const rows = 5;

  const gap = Math.max(5, width * 0.018);

  const cellWidth = (width - gap * (columns + 1)) / columns;

  const cellHeight = (height - gap * (rows + 1)) / rows;

  context.fillStyle = foreground;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;

      context.globalAlpha = 0.18 + ((index * 7) % 10) * 0.075;

      context.fillRect(
        gap + column * (cellWidth + gap),

        gap + row * (cellHeight + gap),

        cellWidth,
        cellHeight,
      );
    }
  }

  context.globalAlpha = 1;
}

/*
 * Canvas: радиальная композиция.
 */
function drawRadial(context, width, height, foreground) {
  const centerX = width / 2;
  const centerY = height / 2;

  const radius = Math.min(width, height) * 0.43;

  const rays = 28;

  context.strokeStyle = foreground;

  context.lineWidth = Math.max(1.5, width * 0.005);

  for (let index = 0; index < rays; index += 1) {
    const angle = (Math.PI * 2 * index) / rays;

    const innerRadius = radius * (index % 2 === 0 ? 0.18 : 0.34);

    context.globalAlpha = 0.34 + (index % 5) * 0.13;

    context.beginPath();

    context.moveTo(
      centerX + Math.cos(angle) * innerRadius,

      centerY + Math.sin(angle) * innerRadius,
    );

    context.lineTo(
      centerX + Math.cos(angle) * radius,

      centerY + Math.sin(angle) * radius,
    );

    context.stroke();
  }

  context.globalAlpha = 1;
}

/*
 * Выбирает рисунок по data-lattice-canvas.
 */
function drawCanvas(lattice, canvas) {
  const prepared = prepareCanvas(canvas);

  if (!prepared) {
    return;
  }

  const { context, width, height } = prepared;

  const { background, foreground } = getCanvasColors(lattice);

  context.fillStyle = background;

  context.fillRect(0, 0, width, height);

  switch (canvas.dataset.latticeCanvas) {
    case "grid":
      drawGrid(context, width, height, foreground);

      break;

    case "waves":
      drawWaves(context, width, height, foreground);

      break;

    case "blocks":
      drawBlocks(context, width, height, foreground);

      break;

    case "radial":
      drawRadial(context, width, height, foreground);

      break;

    case "orbit":
    default:
      drawOrbit(context, width, height, foreground);

      break;
  }
}

/*
 * Монтирует один экземпляр Lattice.
 */
function mountLattice(lattice, motion) {
  const previousDestroy = lattice[LATTICE_DESTROY];

  if (typeof previousDestroy === "function") {
    previousDestroy();
  }

  /*
   * Ячейки, меняющиеся по hover и scroll.
   */
  const hoverCells = Array.from(lattice.querySelectorAll('[data-cell="hover-image"]'));

  /*
   * Автоматические слайдеры.
   */
  const sliderRecords = Array.from(lattice.querySelectorAll("[data-lattice-slider]"))
    .map((slider) => {
      const slides = Array.from(slider.querySelectorAll("[data-lattice-slide]"));

      if (slides.length === 0) {
        return null;
      }

      return {
        slides,

        index: 0,
        timer: 0,

        /*
         * data-interval задаётся в миллисекундах.
         * Минимальное значение — 800.
         */
        interval: Math.max(800, Number(slider.dataset.interval) || 2200),
      };
    })
    .filter(Boolean);

  /*
   * Все canvas внутри этого экземпляра.
   */
  const canvases = Array.from(lattice.querySelectorAll("canvas[data-lattice-canvas]"));

  const abortController = new AbortController();

  const { signal } = abortController;

  let resizeObserver = null;
  let scrollFrame = 0;

  let motionAllowed = true;
  let destroyed = false;

  /*
   * Мгновенно показывает выбранный слайд.
   */
  function showSlide(record, index) {
    const normalizedIndex =
      ((index % record.slides.length) + record.slides.length) % record.slides.length;

    record.index = normalizedIndex;

    record.slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== normalizedIndex;
    });
  }

  /*
   * Останавливает все таймеры.
   */
  function stopSliders() {
    sliderRecords.forEach((record) => {
      if (!record.timer) {
        return;
      }

      window.clearInterval(record.timer);

      record.timer = 0;
    });
  }

  /*
   * Запускает автоматическую смену слайдов.
   */
  function startSliders() {
    stopSliders();

    sliderRecords.forEach((record) => {
      showSlide(record, record.index);

      /*
       * При reduced motion слайдер
       * остаётся статичным.
       */
      if (!motionAllowed || record.slides.length < 2) {
        return;
      }

      record.timer = window.setInterval(
        () => {
          /*
           * В фоновой вкладке
           * состояние не меняется.
           */
          if (document.hidden) {
            return;
          }

          showSlide(record, record.index + 1);
        },

        record.interval,
      );
    });
  }

  /*
   * Перерисовывает все canvas.
   */
  function drawCanvases() {
    canvases.forEach((canvas) => {
      drawCanvas(lattice, canvas);
    });
  }

  /*
   * Мгновенно меняет hover-image ячейку
   * при прохождении через viewport.
   */
  function updateHoverCells() {
    scrollFrame = 0;

    if (destroyed || hoverCells.length === 0) {
      return;
    }

    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    const viewportTop = window.visualViewport?.offsetTop ?? 0;

    const activationLine = viewportTop + viewportHeight * 0.56;

    const exitLine = viewportTop + viewportHeight * 0.14;

    hoverCells.forEach((cell) => {
      const rect = cell.getBoundingClientRect();

      const active = rect.top <= activationLine && rect.bottom >= exitLine;

      cell.toggleAttribute("data-scroll-active", active);
    });
  }

  /*
   * requestAnimationFrame используется
   * только для ограничения частоты расчётов.
   *
   * Плавной анимации он не создаёт.
   */
  function requestHoverUpdate() {
    if (scrollFrame || destroyed) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(updateHoverCells);
  }

  /*
   * Подключение к общему motionPreference.
   */
  const unsubscribeMotion =
    typeof motion?.subscribe === "function"
      ? motion.subscribe(({ allowed }) => {
          motionAllowed = Boolean(allowed);

          startSliders();
        })
      : (() => {
          motionAllowed = true;

          startSliders();

          return noop;
        })();

  /*
   * Обновление hover-image при скролле.
   */
  window.addEventListener("scroll", requestHoverUpdate, {
    passive: true,
    signal,
  });

  /*
   * При resize пересчитываем hover
   * и перерисовываем canvas.
   */
  const handleResize = () => {
    requestHoverUpdate();
    drawCanvases();
  };

  window.addEventListener("resize", handleResize, {
    passive: true,
    signal,
  });

  window.visualViewport?.addEventListener("resize", handleResize, {
    passive: true,
    signal,
  });

  /*
   * Canvas реагирует на изменение
   * размера самого компонента.
   */
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(drawCanvases);

    resizeObserver.observe(lattice);
  }

  lattice.setAttribute("data-lattice-mounted", "");

  /*
   * Начальное состояние.
   */
  sliderRecords.forEach((record) => {
    showSlide(record, 0);
  });

  drawCanvases();
  requestHoverUpdate();

  /*
   * Полное уничтожение экземпляра.
   */
  const destroyLattice = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;

    unsubscribeMotion();

    abortController.abort();

    resizeObserver?.disconnect();

    stopSliders();

    if (scrollFrame) {
      window.cancelAnimationFrame(scrollFrame);

      scrollFrame = 0;
    }

    hoverCells.forEach((cell) => {
      cell.removeAttribute("data-scroll-active");
    });

    lattice.removeAttribute("data-lattice-mounted");

    if (lattice[LATTICE_DESTROY] === destroyLattice) {
      delete lattice[LATTICE_DESTROY];
    }
  };

  lattice[LATTICE_DESTROY] = destroyLattice;

  return destroyLattice;
}

/*
 * Публичный lifecycle API компонента.
 */
export function createLattice({ root = document, motion } = {}) {
  const lattices = getLatticeRoots(root);

  const cleanups = lattices.map((lattice) => mountLattice(lattice, motion));

  if (cleanups.length === 0) {
    return null;
  }

  let destroyed = false;

  return function destroyLattices() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    for (let index = cleanups.length - 1; index >= 0; index -= 1) {
      cleanups[index]?.();
    }

    cleanups.length = 0;
  };
}
