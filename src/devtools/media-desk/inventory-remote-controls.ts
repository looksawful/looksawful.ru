import { projectCardPresentations } from "../../data/projects.ts";
import { petProjectCards } from "../../data/subproject-cards.ts";
import type { MediaDeskInventoryRecord } from "./inventory-model.ts";
import {
  assignPetCoverFromInventory,
  assignProjectCoverFromInventory,
  deleteInventoryRecord,
  remoteControlState,
  replaceInventoryRecord,
} from "./remote-actions.ts";
import {
  RemoteMediaDeskError,
  RemoteMediaDeskSession,
} from "./remote-client.ts";

let remoteSession: RemoteMediaDeskSession | null = null;
let remoteReady: Promise<string> | null = null;

function session(): RemoteMediaDeskSession {
  remoteSession ??= new RemoteMediaDeskSession();
  return remoteSession;
}

function ensureSession(): Promise<string> {
  remoteReady ??= session().initialize().catch((error) => {
    remoteReady = null;
    throw error;
  });
  return remoteReady;
}

function button(label: string, className = "md-button"): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = label;
  return node;
}

function selectControl(labelText: string): { label: HTMLLabelElement; select: HTMLSelectElement } {
  const label = document.createElement("label");
  label.className = "md-remote-actions__field";
  const text = document.createElement("span");
  text.textContent = labelText;
  const select = document.createElement("select");
  select.className = "md-control";
  label.append(text, select);
  return { label, select };
}

function option(value: string, label: string): HTMLOptionElement {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = label;
  return node;
}
function statusText(error: unknown): string {
  if (error instanceof RemoteMediaDeskError && error.status === 409) {
    return `Конфликт: ${error.message}. Обновите HEAD и повторите действие.`;
  }
  return error instanceof Error ? error.message : "Неизвестная ошибка Media Desk";
}

function fileAccept(record: MediaDeskInventoryRecord): string {
  if (record.item.asset.type === "image") return "image/*";
  if (record.item.asset.type === "video") return "video/*";
  return ".glb,.gltf,model/gltf-binary,model/gltf+json";
}

export function createInventoryRemoteControls(
  record: MediaDeskInventoryRecord,
  onDeleted?: () => void,
): HTMLElement {
  const state = remoteControlState(record);
  const root = document.createElement("section");
  root.className = "md-remote-actions";

  const actions = document.createElement("div");
  actions.className = "md-remote-actions__buttons";
  const replace = button("Заменить");
  const remove = button("Удалить", "md-button md-button--danger");
  const refresh = button("Обновить HEAD", "md-button md-button--secondary");
  refresh.hidden = true;

  const status = document.createElement("p");
  status.className = "md-remote-actions__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = fileAccept(record);
  fileInput.hidden = true;

  const assignments = document.createElement("div");
  assignments.className = "md-remote-actions__assignments";

  const projectField = selectControl("Обложка проекта");
  for (const project of projectCardPresentations) {
    projectField.select.append(option(project.id, project.title));
  }
  const projectAssign = button("Назначить", "md-button md-button--secondary");
  const projectAssignable = record.item.asset.type === "image"
    && Boolean(record.item.asset.width)
    && Boolean(record.item.asset.height);
  projectField.select.disabled = !projectAssignable;
  projectAssign.disabled = !projectAssignable;

  const petField = selectControl("Обложка pet");
  for (const pet of petProjectCards) petField.select.append(option(pet.id, pet.title));
  const entryField = selectControl("MediaEntry");
  for (const entryId of record.usage.entryIds) entryField.select.append(option(entryId, entryId));
  const petAssign = button("Назначить", "md-button md-button--secondary");
  const petAssignable = record.usage.entryIds.length > 0;
  petField.select.disabled = !petAssignable;
  entryField.select.disabled = !petAssignable;
  petAssign.disabled = !petAssignable;
  assignments.append(projectField.label, projectAssign, petField.label, entryField.label, petAssign);

  replace.disabled = !state.replaceEnabled;
  remove.disabled = !state.deleteEnabled;
  if (!state.replaceEnabled) replace.title = state.deleteReason;
  if (!state.deleteEnabled) {
    remove.title = state.deleteReason;
    status.textContent = state.deleteReason ? `Удаление заблокировано: ${state.deleteReason}` : "";
  }

  const setBusy = (busy: boolean): void => {
    replace.disabled = busy || !state.replaceEnabled;
    remove.disabled = busy || !state.deleteEnabled;
    projectAssign.disabled = busy || !projectAssignable;
    petAssign.disabled = busy || !petAssignable;
    projectField.select.disabled = busy || !projectAssignable;
    petField.select.disabled = busy || !petAssignable;
    entryField.select.disabled = busy || !petAssignable;
    refresh.disabled = busy;
    root.dataset.busy = busy ? "true" : "false";
  };

  const showError = (error: unknown): void => {
    status.textContent = statusText(error);
    refresh.hidden = !(error instanceof RemoteMediaDeskError && error.status === 409);
  };

  refresh.addEventListener("click", () => {
    void (async () => {
      setBusy(true);
      try {
        remoteReady = null;
        const head = await ensureSession();
        status.textContent = `HEAD обновлён: ${head.slice(0, 12)}`;
        refresh.hidden = true;
      } catch (error) {
        showError(error);
      } finally {
        setBusy(false);
      }
    })();
  });
  replace.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    void (async () => {
      setBusy(true);
      status.textContent = "Заменяю исходник…";
      try {
        await ensureSession();
        const result = await replaceInventoryRecord(session(), record, file);
        const head = typeof result.branchHead === "string" ? result.branchHead : session().expectedHead();
        status.textContent = `Исходник заменён · ${head.slice(0, 12)}`;
        refresh.hidden = true;
      } catch (error) {
        showError(error);
      } finally {
        setBusy(false);
      }
    })();
  });

  projectAssign.addEventListener("click", () => {
    void (async () => {
      setBusy(true);
      status.textContent = "Назначаю обложку проекта…";
      try {
        await ensureSession();
        await assignProjectCoverFromInventory(session(), record, projectField.select.value);
        status.textContent = `Обложка проекта назначена: ${projectField.select.value}`;
        refresh.hidden = true;
      } catch (error) {
        showError(error);
      } finally {
        setBusy(false);
      }
    })();
  });

  petAssign.addEventListener("click", () => {
    void (async () => {
      setBusy(true);
      status.textContent = "Назначаю обложку pet…";
      try {
        await ensureSession();
        await assignPetCoverFromInventory(
          session(),
          record,
          petField.select.value,
          entryField.select.value,
        );
        status.textContent = `Обложка pet назначена: ${petField.select.value}`;
        refresh.hidden = true;
      } catch (error) {
        showError(error);
      } finally {
        setBusy(false);
      }
    })();
  });

  remove.addEventListener("click", () => {
    if (!state.deleteEnabled) return;
    const accepted = window.confirm(`Удалить ${record.assetId} из Media Catalog и репозитория?`);
    if (!accepted) return;
    void (async () => {
      setBusy(true);
      status.textContent = "Удаляю…";
      try {
        await ensureSession();
        await deleteInventoryRecord(session(), record);
        status.textContent = "Удалено из authoring branch";
        refresh.hidden = true;
        onDeleted?.();
      } catch (error) {
        showError(error);
      } finally {
        setBusy(false);
      }
    })();
  });

  actions.append(replace, remove, refresh, fileInput);
  root.append(actions, assignments, status);
  return root;
}

export function getRemoteMediaDeskSession(): RemoteMediaDeskSession {
  return session();
}

export function ensureRemoteMediaDeskSession(): Promise<string> {
  return ensureSession();
}
