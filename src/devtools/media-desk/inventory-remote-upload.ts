import {
  REMOTE_MEDIA_TRANSPORT_LIMIT_BYTES,
  uploadNewMedia,
} from "./remote-actions.ts";
import {
  ensureRemoteMediaDeskSession,
  getRemoteMediaDeskSession,
} from "./inventory-remote-controls.ts";

interface ProbedMediaFile {
  readonly width: number;
  readonly height: number;
  readonly durationSeconds: number;
}

function field(labelText: string, control: HTMLElement): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "md-remote-upload__field";
  const text = document.createElement("span");
  text.textContent = labelText;
  label.append(text, control);
  return label;
}

function textInput(type = "text"): HTMLInputElement {
  const input = document.createElement("input");
  input.type = type;
  input.className = "md-control";
  return input;
}
function checkbox(labelText: string, checked = false): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "md-remote-upload__check";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  const text = document.createElement("span");
  text.textContent = labelText;
  label.append(input, text);
  return label;
}

function filenameTitle(name: string): string {
  return name.replace(/\.[^.]+$/u, "").replace(/[-_]+/gu, " ").trim();
}

function readableBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function imageMetadata(url: string): Promise<ProbedMediaFile> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, durationSeconds: 0 });
    image.onerror = () => reject(new Error("Не удалось прочитать размеры изображения"));
    image.src = url;
  });
}
function videoMetadata(file: File): Promise<ProbedMediaFile> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const finish = (metadata: ProbedMediaFile): void => {
      video.srcObject = null;
      resolve(metadata);
    };
    video.onloadedmetadata = () => finish({
      width: video.videoWidth,
      height: video.videoHeight,
      durationSeconds: Number.isFinite(video.duration) ? video.duration : 0,
    });
    video.onerror = () => finish({ width: 0, height: 0, durationSeconds: 0 });
    try {
      video.srcObject = file;
    } catch {
      finish({ width: 0, height: 0, durationSeconds: 0 });
    }
  });
}

export async function probeMediaFile(file: File): Promise<ProbedMediaFile> {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Поддерживаются только изображения и видео");
  }
  if (file.type.startsWith("video/")) return videoMetadata(file);
  const url = URL.createObjectURL(file);
  try {
    return await imageMetadata(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function createRemoteUploadPanel(): HTMLElement {
  const panel = document.createElement("details");
  panel.className = "md-remote-upload";
  const summary = document.createElement("summary");
  summary.textContent = "Добавить медиа";
  const form = document.createElement("form");
  form.className = "md-remote-upload__form";
  const fileInput = textInput("file");
  fileInput.accept = "image/*,video/*";
  fileInput.required = true;
  const title = textInput();
  title.required = true;
  title.name = "title";
  const alt = textInput();
  alt.name = "alt";
  const description = document.createElement("textarea");
  description.className = "md-control";
  description.rows = 3;

  const galleryLabel = checkbox("Показывать в галерее", true);
  const gallery = galleryLabel.querySelector<HTMLInputElement>("input")!;
  const reusableLabel = checkbox("Можно переиспользовать", false);
  const reusable = reusableLabel.querySelector<HTMLInputElement>("input")!;
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "md-button";
  submit.textContent = "Загрузить";

  const technical = document.createElement("p");
  technical.className = "md-remote-upload__technical";
  technical.textContent = `Remote limit: ${REMOTE_MEDIA_TRANSPORT_LIMIT_BYTES / (1024 * 1024)} MiB`;
  const status = document.createElement("p");
  status.className = "md-remote-upload__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  let probed: ProbedMediaFile | null = null;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    probed = null;
    if (!file) return;
    if (!title.value.trim()) title.value = filenameTitle(file.name);
    technical.textContent = `Читаю файл · ${readableBytes(file.size)}`;
    void probeMediaFile(file)
      .then((metadata) => {
        probed = metadata;
        const duration = metadata.durationSeconds > 0
          ? ` · ${metadata.durationSeconds.toFixed(2)} s`
          : "";
        technical.textContent = `${metadata.width} × ${metadata.height}${duration} · ${readableBytes(file.size)} · limit 16 MiB`;
      })
      .catch((error: unknown) => {
        status.textContent = error instanceof Error ? error.message : "Не удалось прочитать медиа";
      });
  });

  const setBusy = (busy: boolean): void => {
    submit.disabled = busy;
    fileInput.disabled = busy;
    title.disabled = busy;
    alt.disabled = busy;
    description.disabled = busy;
    gallery.disabled = busy;
    reusable.disabled = busy;
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = fileInput.files?.[0];
    if (!file) return;
    void (async () => {
      setBusy(true);
      status.textContent = "Загружаю в authoring branch…";
      try {
        const metadata = probed ?? await probeMediaFile(file);
        await ensureRemoteMediaDeskSession();
        const result = await uploadNewMedia(getRemoteMediaDeskSession(), file, {
          title: title.value,
          alt: alt.value,
          description: description.value,
          width: metadata.width,
          height: metadata.height,
          durationSeconds: metadata.durationSeconds,
          showInCatalog: gallery.checked,
          reusable: reusable.checked,
        });
        const assetId = typeof result.assetId === "string" ? result.assetId : "new asset";
        const head = typeof result.branchHead === "string" ? result.branchHead : getRemoteMediaDeskSession().expectedHead();
        status.textContent = `${assetId} добавлен · HEAD ${head.slice(0, 12)}. После публикации/пересборки появится в inventory.`;
        form.reset();
        gallery.checked = true;
        probed = null;
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Ошибка загрузки";
      } finally {
        setBusy(false);
      }
    })();
  });
  form.append(
    field("Файл", fileInput),
    field("Title", title),
    field("Alt", alt),
    field("Описание", description),
    galleryLabel,
    reusableLabel,
    submit,
    technical,
    status,
  );
  panel.append(summary, form);
  return panel;
}
