export const CONTACT_MESSAGE_MAX_LENGTH = 5000;

export interface ContactFormDraft {
  name: string;
  email: string;
  message: string;
}

export type ContactFormErrorCode = "required" | "invalid" | "too-long";
export type ContactFormErrors = Partial<Record<keyof ContactFormDraft, ContactFormErrorCode>>;

export function normalizeContactFormDraft(draft: ContactFormDraft): ContactFormDraft {
  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    message: draft.message,
  };
}

function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

export function validateContactFormDraft(draft: ContactFormDraft): ContactFormErrors {
  const normalized = normalizeContactFormDraft(draft);
  const errors: ContactFormErrors = {};

  if (!normalized.email) {
    errors.email = "required";
  } else if (!isValidEmail(normalized.email)) {
    errors.email = "invalid";
  }

  if (!normalized.message.trim()) {
    errors.message = "required";
  } else if (normalized.message.length > CONTACT_MESSAGE_MAX_LENGTH) {
    errors.message = "too-long";
  }

  return errors;
}
