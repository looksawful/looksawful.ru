import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

const PRECISE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const DESKTOP_MORPH_DURATION = 0.6;
const COARSE_MORPH_DURATION = 0.38;
const EYE_NORMALIZATION_DISTANCE = 180;
const EYE_TRACK_X = 18;
const EYE_TRACK_LEFT_Y = 14;
const EYE_TRACK_RIGHT_Y = 7;
const PREVIEW_FOLLOW_EASE = 0.18;
const PREVIEW_POINTER_OFFSET = 28;

const noop = () => {};

type MotionPreferenceState = {
  reduced: boolean;
  allowed: boolean;
};

type MotionPreference = {
  isReduced(): boolean;
  allowsMotion(): boolean;
  subscribe(
    listener: (state: MotionPreferenceState) => void,
    options?: { immediate?: boolean },
  ): () => void;
};

type FaceMode = "desktop" | "coarse";

export function initSiteNavigation(
  root: Document | HTMLElement = document,
  motion?: MotionPreference,
): () => void {
  const navigation = root.querySelector<HTMLElement>("[data-site-navigation]");
  if (!(navigation instanceof HTMLElement)) return noop;

  const toggle = navigation.querySelector<HTMLButtonElement>("[data-site-menu-toggle]");
  const menu = navigation.querySelector<HTMLElement>("[data-site-menu]");
  if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) {
    return noop;
  }

  const doc = navigation.ownerDocument;
  const win = doc.defaultView;
  const body = doc.body;
  const main = doc.querySelector<HTMLElement>("main");
  const precisePointer = win?.matchMedia?.(PRECISE_POINTER_QUERY) ?? null;

  let open = false;
  let previousOverflow = "";
  let previousMainInert = main?.inert ?? false;
  let motionAllowed = motion?.allowsMotion() ?? false;
  let setFaceOpen: (nextOpen: boolean) => void = noop;
  let syncFaceCapability: () => void = noop;
  let hideMenuPreview: () => void = noop;
  let prepareMenuPreviews: () => void = noop;
  let syncPreviewCapability: () => void = noop;

  const setOpen = (nextOpen: boolean, returnFocus = false): void => {
    if (nextOpen === open) return;

    open = nextOpen;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    navigation.toggleAttribute("data-menu-open", open);
    menu.hidden = !open;

    hideMenuPreview();
    setFaceOpen(open);

    if (open) {
      if (main instanceof HTMLElement) {
        previousMainInert = main.inert;
        main.inert = true;
      }
      prepareMenuPreviews();
      previousOverflow = body.style.overflow;
      body.style.overflow = "hidden";
      return;
    }

    body.style.overflow = previousOverflow;
    if (main instanceof HTMLElement) main.inert = previousMainInert;
    if (returnFocus) toggle.focus();
  };

  const onToggle = (): void => setOpen(!open);
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && open) {
      setOpen(false, true);
    }
  };
  const onMenuClick = (event: Event): void => {
    const target = event.target;
    if (target instanceof Element && target.closest("a[href]")) {
      setOpen(false);
    }
  };

  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Открыть меню");
  navigation.removeAttribute("data-menu-open");
  menu.hidden = true;

  toggle.addEventListener("click", onToggle);
  doc.addEventListener("keydown", onKeyDown);
  menu.addEventListener("click", onMenuClick);

  const preview = navigation.querySelector<HTMLElement>("[data-menu-preview]");
  const previewImage = navigation.querySelector<HTMLImageElement>("[data-menu-preview-image]");
  const previewLinks = [...menu.querySelectorAll<HTMLAnchorElement>(".site-nav__menu-link[data-preview]")];
  const previewBar = navigation.querySelector<HTMLElement>(".site-nav__bar");
  let previewVisible = false;
  let previewPreloaded = false;
  let previewRaf = 0;
  let previewPointerListening = false;
  let previewTargetX = win ? win.innerWidth * 0.72 : 0;
  let previewTargetY = win ? win.innerHeight * 0.45 : 0;
  let previewX = previewTargetX;
  let previewY = previewTargetY;
  let previewHeaderBottom = 0;

  const updatePreviewHeaderBottom = (): void => {
    previewHeaderBottom = previewBar?.getBoundingClientRect().bottom ?? 0;
  };

  const positionPreview = (x: number, y: number): void => {
    if (!(preview instanceof HTMLElement) || !win) return;

    const width = preview.offsetWidth || 360;
    const height = preview.offsetHeight || width * (680 / 790);
    let left = x + PREVIEW_POINTER_OFFSET;
    let top = y - height * 0.5;

    if (left + width > win.innerWidth - 20) {
      left = x - width - PREVIEW_POINTER_OFFSET;
    }

    left = Math.max(16, Math.min(win.innerWidth - width - 16, left));
    top = Math.max(
      previewHeaderBottom + 10,
      Math.min(win.innerHeight - height - 20, top),
    );

    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;
  };

  const stopPreviewFollower = (): void => {
    if (previewRaf && win) {
      win.cancelAnimationFrame(previewRaf);
      previewRaf = 0;
    }
    if (previewPointerListening) {
      doc.removeEventListener("pointermove", onPreviewPointerMove);
      previewPointerListening = false;
    }
  };

  const previewFrame = (): void => {
    if (!previewVisible || !motionAllowed || !precisePointer?.matches || !win) {
      previewRaf = 0;
      return;
    }

    previewX += (previewTargetX - previewX) * PREVIEW_FOLLOW_EASE;
    previewY += (previewTargetY - previewY) * PREVIEW_FOLLOW_EASE;
    positionPreview(previewX, previewY);
    previewRaf = win.requestAnimationFrame(previewFrame);
  };

  function onPreviewPointerMove(event: PointerEvent): void {
    previewTargetX = event.clientX;
    previewTargetY = event.clientY;
  }

  const startPreviewFollower = (event: PointerEvent): void => {
    if (!win || !motionAllowed || !precisePointer?.matches) return;

    previewTargetX = event.clientX;
    previewTargetY = event.clientY;
    previewX = previewTargetX;
    previewY = previewTargetY;
    positionPreview(previewX, previewY);

    if (!previewPointerListening) {
      doc.addEventListener("pointermove", onPreviewPointerMove, { passive: true });
      previewPointerListening = true;
    }
    if (!previewRaf) previewRaf = win.requestAnimationFrame(previewFrame);
  };

  const positionPreviewStatically = (): void => {
    if (!win) return;
    updatePreviewHeaderBottom();
    positionPreview(win.innerWidth * 0.68, win.innerHeight * 0.46);
  };

  hideMenuPreview = (): void => {
    previewVisible = false;
    stopPreviewFollower();
    if (preview instanceof HTMLElement) {
      preview.dataset.visible = "false";
    }
  };

  const showPreviewFor = (link: HTMLAnchorElement, event: PointerEvent): void => {
    if (
      !open ||
      !precisePointer?.matches ||
      !(preview instanceof HTMLElement) ||
      !(previewImage instanceof HTMLImageElement)
    ) {
      return;
    }

    const src = link.dataset.preview ?? "";
    if (!src) return;

    if (previewImage.getAttribute("src") !== src) {
      previewImage.src = src;
    }
    preview.hidden = false;
    preview.dataset.visible = "true";
    previewVisible = true;
    updatePreviewHeaderBottom();

    if (motionAllowed) {
      startPreviewFollower(event);
      return;
    }

    stopPreviewFollower();
    positionPreviewStatically();
  };

  const onMenuPointerOver = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>(".site-nav__menu-link[data-preview]");
    if (link) showPreviewFor(link, event);
  };

  const onMenuPointerOut = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>(".site-nav__menu-link[data-preview]");
    if (!link) return;
    const related = event.relatedTarget;
    if (related instanceof Node && link.contains(related)) return;
    hideMenuPreview();
  };

  if (preview instanceof HTMLElement && previewImage instanceof HTMLImageElement && previewLinks.length) {
    menu.addEventListener("pointerover", onMenuPointerOver);
    menu.addEventListener("pointerout", onMenuPointerOut);

    prepareMenuPreviews = (): void => {
      if (previewPreloaded || !precisePointer?.matches || !win) return;
      previewPreloaded = true;
      const sources = new Set(previewLinks.map((link) => link.dataset.preview).filter(Boolean));
      for (const src of sources) {
        const image = new win.Image();
        image.src = src as string;
      }
    };

    syncPreviewCapability = (): void => {
      updatePreviewHeaderBottom();
      if (!precisePointer?.matches) {
        hideMenuPreview();
        preview.hidden = true;
      }
    };
  }

  const face = navigation.querySelector<SVGSVGElement>("[data-awfulface]");
  const eyeLeft = face?.querySelector<SVGEllipseElement>("[data-awfulface-eye-left]") ?? null;
  const eyeRight = face?.querySelector<SVGEllipseElement>("[data-awfulface-eye-right]") ?? null;
  const accentTop = face?.querySelector<SVGPathElement>("[data-awfulface-accent-top]") ?? null;
  const accentBottom = face?.querySelector<SVGPathElement>("[data-awfulface-accent-bottom]") ?? null;
  const faceUpper = face?.querySelector<SVGPathElement>("[data-awfulface-face-upper]") ?? null;
  const faceLower = face?.querySelector<SVGPathElement>("[data-awfulface-face-lower]") ?? null;
  const collapseUpper = face?.querySelector<SVGPathElement>('[data-awfulface-target="collapse-upper"]') ?? null;
  const collapseLower = face?.querySelector<SVGPathElement>('[data-awfulface-target="collapse-lower"]') ?? null;

  const faceReady = Boolean(
    face &&
    eyeLeft &&
    eyeRight &&
    accentTop &&
    accentBottom &&
    faceUpper &&
    faceLower &&
    collapseUpper &&
    collapseLower,
  );

  let faceTimeline: gsap.core.Timeline | null = null;
  let faceMode: FaceMode | null = null;
  let morphing = false;
  let trackingActive = false;
  let trackingResizeObserver: ResizeObserver | null = null;
  let faceCenterX = 0;
  let faceCenterY = 0;

  const originalFaceUpper = faceUpper?.getAttribute("d") ?? "";
  const originalFaceLower = faceLower?.getAttribute("d") ?? "";
  const originalAccentTop = accentTop?.getAttribute("d") ?? "";
  const originalAccentBottom = accentBottom?.getAttribute("d") ?? "";

  const leftEyeX = eyeLeft ? gsap.quickTo(eyeLeft, "x", { duration: 0.55, ease: "power3.out" }) : null;
  const leftEyeY = eyeLeft ? gsap.quickTo(eyeLeft, "y", { duration: 0.55, ease: "power3.out" }) : null;
  const rightEyeX = eyeRight ? gsap.quickTo(eyeRight, "x", { duration: 0.55, ease: "power3.out" }) : null;
  const rightEyeY = eyeRight ? gsap.quickTo(eyeRight, "y", { duration: 0.55, ease: "power3.out" }) : null;

  const resetEyes = (immediate = false): void => {
    if (!eyeLeft || !eyeRight) return;
    if (immediate) {
      gsap.set([eyeLeft, eyeRight], { x: 0, y: 0 });
      return;
    }
    leftEyeX?.(0);
    leftEyeY?.(0);
    rightEyeX?.(0);
    rightEyeY?.(0);
  };

  const updateFaceCenter = (): void => {
    const rect = toggle.getBoundingClientRect();
    faceCenterX = rect.left + rect.width / 2;
    faceCenterY = rect.top + rect.height / 2;
  };

  const onEyePointerMove = (event: PointerEvent): void => {
    if (!trackingActive) return;

    const dx = event.clientX - faceCenterX;
    const dy = event.clientY - faceCenterY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const strength = Math.min(1, distance / EYE_NORMALIZATION_DISTANCE);
    const nx = (dx / distance) * strength;
    const ny = (dy / distance) * strength;

    leftEyeX?.(nx * EYE_TRACK_X);
    leftEyeY?.(ny * EYE_TRACK_LEFT_Y);
    rightEyeX?.(nx * EYE_TRACK_X);
    rightEyeY?.(ny * EYE_TRACK_RIGHT_Y);
  };

  const onEyePointerOut = (event: PointerEvent): void => {
    if (event.relatedTarget === null) resetEyes();
  };

  const onWindowBlur = (): void => resetEyes();
  const onFaceLayoutChange = (): void => updateFaceCenter();

  const stopEyeTracking = (): void => {
    if (!trackingActive || !win) return;
    trackingActive = false;
    doc.removeEventListener("pointermove", onEyePointerMove);
    doc.removeEventListener("pointerout", onEyePointerOut);
    win.removeEventListener("blur", onWindowBlur);
    win.removeEventListener("resize", onFaceLayoutChange);
    trackingResizeObserver?.disconnect();
    trackingResizeObserver = null;
    resetEyes();
  };

  const startEyeTracking = (): void => {
    if (trackingActive || !win || !faceReady) return;
    trackingActive = true;
    updateFaceCenter();
    doc.addEventListener("pointermove", onEyePointerMove, { passive: true });
    doc.addEventListener("pointerout", onEyePointerOut, { passive: true });
    win.addEventListener("blur", onWindowBlur);
    win.addEventListener("resize", onFaceLayoutChange, { passive: true });
    if (typeof ResizeObserver === "function") {
      trackingResizeObserver = new ResizeObserver(updateFaceCenter);
      trackingResizeObserver.observe(toggle);
    }
  };

  const syncEyeTracking = (): void => {
    const shouldTrack = Boolean(
      faceReady && precisePointer?.matches && motionAllowed && !open && !morphing,
    );
    if (shouldTrack) startEyeTracking();
    else stopEyeTracking();
  };

  const getFaceTarget = (mode: FaceMode, half: "upper" | "lower"): SVGPathElement | null => (
    face?.querySelector<SVGPathElement>(`[data-awfulface-target="${mode}-${half}"]`) ?? null
  );

  const setClosedFaceImmediately = (): void => {
    if (!faceReady || !faceUpper || !faceLower || !accentTop || !accentBottom || !eyeLeft || !eyeRight) return;
    faceUpper.setAttribute("d", originalFaceUpper);
    faceLower.setAttribute("d", originalFaceLower);
    accentTop.setAttribute("d", originalAccentTop);
    accentBottom.setAttribute("d", originalAccentBottom);
    gsap.set([accentTop, accentBottom, eyeLeft, eyeRight], { opacity: 1 });
    gsap.set([eyeLeft, eyeRight], { x: 0, y: 0 });
  };

  const snapFaceToLogicalState = (nextOpen: boolean): void => {
    if (
      !faceReady ||
      !faceUpper ||
      !faceLower ||
      !accentTop ||
      !accentBottom ||
      !eyeLeft ||
      !eyeRight ||
      !collapseUpper ||
      !collapseLower
    ) return;

    faceTimeline?.kill();
    faceTimeline = null;
    faceMode = null;

    if (!nextOpen) {
      setClosedFaceImmediately();
      morphing = false;
      syncEyeTracking();
      return;
    }

    const mode: FaceMode = precisePointer?.matches ? "desktop" : "coarse";
    const upperTarget = getFaceTarget(mode, "upper");
    const lowerTarget = getFaceTarget(mode, "lower");
    if (!upperTarget || !lowerTarget) return;

    faceUpper.setAttribute("d", upperTarget.getAttribute("d") ?? originalFaceUpper);
    faceLower.setAttribute("d", lowerTarget.getAttribute("d") ?? originalFaceLower);
    accentTop.setAttribute("d", collapseUpper.getAttribute("d") ?? originalAccentTop);
    accentBottom.setAttribute("d", collapseLower.getAttribute("d") ?? originalAccentBottom);
    gsap.set([accentTop, accentBottom, eyeLeft, eyeRight], { opacity: 0 });
    gsap.set([eyeLeft, eyeRight], { x: 0, y: 0 });
    morphing = false;
    syncEyeTracking();
  };

  const buildFaceTimeline = (mode: FaceMode): gsap.core.Timeline | null => {
    if (
      !faceReady ||
      !faceUpper ||
      !faceLower ||
      !accentTop ||
      !accentBottom ||
      !eyeLeft ||
      !eyeRight ||
      !collapseUpper ||
      !collapseLower
    ) return null;

    const upperTarget = getFaceTarget(mode, "upper");
    const lowerTarget = getFaceTarget(mode, "lower");
    if (!upperTarget || !lowerTarget) return null;

    const timeline = gsap.timeline({
      paused: true,
      defaults: { duration: DESKTOP_MORPH_DURATION, ease: "power3.inOut" },
      onComplete() {
        morphing = false;
        syncEyeTracking();
      },
      onReverseComplete() {
        morphing = false;
        syncEyeTracking();
      },
    });

    timeline
      .to(faceUpper, { morphSVG: { shape: upperTarget, type: "rotational" } }, 0)
      .to(faceLower, { morphSVG: { shape: lowerTarget, type: "rotational" } }, 0)
      .to(
        accentTop,
        { morphSVG: { shape: collapseUpper, type: "rotational" }, opacity: 0, duration: 0.42 },
        0,
      )
      .to(
        accentBottom,
        { morphSVG: { shape: collapseLower, type: "rotational" }, opacity: 0, duration: 0.42 },
        0,
      )
      .to([eyeLeft, eyeRight], { opacity: 0, duration: 0.26, ease: "power2.in" }, 0.02);

    const targetDuration = mode === "desktop" ? DESKTOP_MORPH_DURATION : COARSE_MORPH_DURATION;
    timeline.timeScale(DESKTOP_MORPH_DURATION / targetDuration);
    return timeline;
  };

  setFaceOpen = (nextOpen: boolean): void => {
    if (!faceReady) return;

    morphing = true;
    stopEyeTracking();
    resetEyes(!motionAllowed);

    if (!motionAllowed) {
      snapFaceToLogicalState(nextOpen);
      return;
    }

    const mode: FaceMode = precisePointer?.matches ? "desktop" : "coarse";
    if (!faceTimeline || faceMode !== mode) {
      faceTimeline?.kill();
      setClosedFaceImmediately();
      faceMode = mode;
      faceTimeline = buildFaceTimeline(mode);
    }

    if (!faceTimeline) {
      morphing = false;
      syncEyeTracking();
      return;
    }

    if (nextOpen) faceTimeline.play();
    else faceTimeline.reverse();
  };

  syncFaceCapability = (): void => {
    if (!faceReady) return;
    if (!motionAllowed) {
      snapFaceToLogicalState(open);
      return;
    }

    const mode: FaceMode = precisePointer?.matches ? "desktop" : "coarse";
    if (open && faceMode !== mode) {
      faceTimeline?.kill();
      setClosedFaceImmediately();
      faceMode = mode;
      faceTimeline = buildFaceTimeline(mode);
      faceTimeline?.progress(1).pause();
      morphing = false;
    }
    syncEyeTracking();
  };

  const onPointerCapabilityChange = (): void => {
    hideMenuPreview();
    syncPreviewCapability();
    syncFaceCapability();
  };

  precisePointer?.addEventListener("change", onPointerCapabilityChange);
  win?.addEventListener("resize", updatePreviewHeaderBottom, { passive: true });

  const unsubscribeMotion = motion?.subscribe(({ allowed }) => {
    motionAllowed = allowed;
    hideMenuPreview();
    syncPreviewCapability();
    syncFaceCapability();
    if (!allowed) snapFaceToLogicalState(open);
  }) ?? noop;

  updatePreviewHeaderBottom();
  syncPreviewCapability();
  syncFaceCapability();

  return () => {
    toggle.removeEventListener("click", onToggle);
    doc.removeEventListener("keydown", onKeyDown);
    menu.removeEventListener("click", onMenuClick);
    menu.removeEventListener("pointerover", onMenuPointerOver);
    menu.removeEventListener("pointerout", onMenuPointerOut);
    precisePointer?.removeEventListener("change", onPointerCapabilityChange);
    win?.removeEventListener("resize", updatePreviewHeaderBottom);
    unsubscribeMotion();

    hideMenuPreview();
    stopEyeTracking();
    faceTimeline?.kill();
    faceTimeline = null;
    if (eyeLeft && eyeRight) gsap.killTweensOf([eyeLeft, eyeRight]);
    if (faceUpper && faceLower && accentTop && accentBottom) {
      gsap.killTweensOf([faceUpper, faceLower, accentTop, accentBottom]);
    }
    setClosedFaceImmediately();

    if (open) {
      open = false;
      body.style.overflow = previousOverflow;
      if (main instanceof HTMLElement) main.inert = previousMainInert;
    }

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Открыть меню");
    navigation.removeAttribute("data-menu-open");
    menu.hidden = true;
    if (preview instanceof HTMLElement) preview.hidden = true;
  };
}
