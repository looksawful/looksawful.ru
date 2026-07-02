const AUDIO_STATE = new WeakMap();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setSlides(root, index) {
  root.querySelectorAll("[data-berserk-slide]").forEach((slide) => {
    slide.classList.toggle("is-active", slide.dataset.berserkSlide === String(index));
  });
}

function stopAudio(state) {
  if (!state) return;
  try {
    state.gain.gain.setTargetAtTime(0, state.context.currentTime, 0.035);
    window.setTimeout(() => {
      try { state.oscillator.stop(); } catch {}
      try { state.context.close(); } catch {}
    }, 90);
  } catch {}
}

function startAudio(root) {
  const range = root.querySelector("[data-berserk-intensity]");
  const intensity = clamp(Number(range?.value || 62) / 100, 0, 1);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.value = 55 + intensity * 75;
  gain.gain.value = 0.015 + intensity * 0.035;
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  return { context, oscillator, gain };
}

function initBerserkPreview(root) {
  if (!(root instanceof Element) || root.dataset.petPreviewMounted === "true") return;
  root.dataset.petPreviewMounted = "true";

  root.addEventListener("click", (event) => {
    const slide = event.target.closest("[data-berserk-slide]");
    if (slide) {
      setSlides(root, slide.dataset.berserkSlide || 0);
      return;
    }

    const play = event.target.closest("[data-berserk-play]");
    if (!play) return;

    const current = AUDIO_STATE.get(root);
    if (current) {
      stopAudio(current);
      AUDIO_STATE.delete(root);
      play.textContent = "play";
      play.setAttribute("aria-pressed", "false");
      root.classList.remove("is-playing");
      return;
    }

    const next = startAudio(root);
    if (!next) return;
    AUDIO_STATE.set(root, next);
    play.textContent = "stop";
    play.setAttribute("aria-pressed", "true");
    root.classList.add("is-playing");
  });

  root.addEventListener("input", (event) => {
    if (!event.target.matches("[data-berserk-intensity]")) return;
    const state = AUDIO_STATE.get(root);
    if (!state) return;
    const intensity = clamp(Number(event.target.value || 62) / 100, 0, 1);
    state.oscillator.frequency.setTargetAtTime(55 + intensity * 75, state.context.currentTime, 0.035);
    state.gain.gain.setTargetAtTime(0.015 + intensity * 0.035, state.context.currentTime, 0.035);
  });
}

export function initPetPreviews(root = document) {
  root.querySelectorAll('[data-pet-preview="berserk-timer"]').forEach(initBerserkPreview);
}