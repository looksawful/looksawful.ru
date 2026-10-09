const CDN = "https://cdn.jsdelivr.net/gh/looksawful/berserk-timer@v0.2.1-beta/assets/";
const RAW = "https://raw.githubusercontent.com/looksawful/berserk-timer/v0.2.1-beta/assets/";

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

export function createBerserkAudioPlayer(root: unknown) {
  if (!(root instanceof HTMLElement)) return () => {};
  const audio = root.querySelector<HTMLAudioElement>("audio");
  const play = root.querySelector<HTMLButtonElement>("[data-audio-play]");
  const progress = root.querySelector<HTMLInputElement>("[data-audio-progress]");
  const fill = root.querySelector<HTMLElement>("[data-audio-progress-fill]");
  const current = root.querySelector<HTMLElement>("[data-audio-current]");
  const duration = root.querySelector<HTMLElement>("[data-audio-duration]");
  const volume = root.querySelector<HTMLInputElement>("[data-audio-volume]");
  const volumeText = root.querySelector<HTMLElement>("[data-audio-volume-text]");
  const status = root.querySelector<HTMLElement>("[data-audio-status]");
  const sounds = [...root.querySelectorAll<HTMLButtonElement>("[data-audio-sound]")];
  if (!(audio instanceof HTMLAudioElement)) return () => {};

  const setStatus = (value: string): void => { if (status) status.textContent = value; };
  const setSound = async (name: string | undefined): Promise<void> => {
    audio.pause();
    sounds.forEach((button) => {
      const active = button.dataset.audioSound === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    audio.src = `${CDN}${name}`;
    audio.load();
    setStatus("ready");
  };

  audio.addEventListener("error", (_event: Event) => {
    const name = sounds.find((button) => button.classList.contains("is-active"))?.dataset.audioSound;
    if (name && !audio.src.startsWith(RAW)) {
      audio.src = `${RAW}${name}`;
      audio.load();
    }
  });

  play?.addEventListener("click", (_event: Event) => {
    if (audio.paused) audio.play().catch(() => setStatus("blocked"));
    else audio.pause();
  });

  audio.addEventListener("play", (_event: Event) => { setStatus("playing"); play?.setAttribute("aria-pressed", "true"); });
  audio.addEventListener("pause", (_event: Event) => { setStatus("ready"); play?.setAttribute("aria-pressed", "false"); });
  const syncProgress = (): void => {
    const durationSeconds = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const currentSeconds = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    if (current) current.textContent = formatTime(currentSeconds);
    if (progress) {
      progress.max = String(durationSeconds);
      progress.value = String(Math.min(durationSeconds, Math.max(0, currentSeconds)));
      progress.setAttribute("aria-valuetext", formatTime(currentSeconds));
    }
    if (fill) fill.style.inlineSize = `${durationSeconds ? (currentSeconds / durationSeconds) * 100 : 0}%`;
  };

  audio.addEventListener("loadedmetadata", (_event: Event) => {
    if (duration) duration.textContent = formatTime(audio.duration);
    syncProgress();
  });
  audio.addEventListener("timeupdate", (_event: Event) => syncProgress());

  progress?.addEventListener("input", (_event: Event) => {
    if (!audio.duration) return;
    audio.currentTime = Math.min(audio.duration, Math.max(0, Number(progress.value)));
    syncProgress();
  });

  volume?.addEventListener("input", (_event: Event) => {
    audio.volume = Number(volume.value);
    if (volumeText) volumeText.textContent = `${Math.round(audio.volume * 10)}/10`;
  });

  sounds.forEach((button) => button.addEventListener("click", (_event: Event) => setSound(button.dataset.audioSound)));

  audio.volume = Number(volume?.value ?? 0.5);
  void setSound(sounds[0]?.dataset.audioSound || "alert1.wav");

  return () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  };
}

export function createBerserkAudioPlayers(root: ParentNode = document) {
  const destroys = [...root.querySelectorAll("[data-berserk-audio-player]")].map(createBerserkAudioPlayer);
  return () => destroys.splice(0).reverse().forEach((destroy) => destroy?.());
}
