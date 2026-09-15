import type { ContactFormDraft } from "./form-contract.ts";

const CONTACT_DRAFT_STORAGE_KEY = "looksawful.contact-hub.draft.v1";

export interface ContactDraftStore {
  read(): ContactFormDraft | null;
  write(draft: ContactFormDraft): void;
  clear(): void;
}

function parseDraft(value: string | null): ContactFormDraft | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.name !== "string" ||
      typeof record.email !== "string" ||
      typeof record.message !== "string"
    ) {
      return null;
    }
    return {
      name: record.name,
      email: record.email,
      message: record.message,
    };
  } catch {
    return null;
  }
}

export function createSessionContactDraftStore(storage: Storage): ContactDraftStore {
  return {
    read() {
      return parseDraft(storage.getItem(CONTACT_DRAFT_STORAGE_KEY));
    },
    write(draft) {
      const stored: ContactFormDraft = {
        name: draft.name,
        email: draft.email,
        message: draft.message,
      };
      storage.setItem(CONTACT_DRAFT_STORAGE_KEY, JSON.stringify(stored));
    },
    clear() {
      storage.removeItem(CONTACT_DRAFT_STORAGE_KEY);
    },
  };
}
