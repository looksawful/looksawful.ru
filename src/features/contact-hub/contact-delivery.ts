const FORM_ENDPOINT = "https://formsubmit.co/ajax/i@lookawful.ru";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const SUBJECT = "Новое сообщение с looksawful.ru";

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
  pageUrl: string;
  attachment?: File;
}

export type ContactDeliveryResult =
  | { kind: "sent" }
  | { kind: "activation_required" }
  | { kind: "invalid"; reason: "attachment_too_large" }
  | { kind: "unavailable" };

function formDataFor(input: ContactMessageInput): FormData {
  const data = new FormData();
  data.set("name", input.name.trim());
  data.set("email", input.email.trim());
  data.set("message", input.message.trim());
  data.set("_replyto", input.email.trim());
  data.set("_subject", SUBJECT);
  data.set("_template", "table");
  data.set("_captcha", "false");
  data.set("_honey", "");
  data.set("_url", input.pageUrl);

  if (input.attachment) data.set("attachment", input.attachment, input.attachment.name);
  return data;
}

function needsActivation(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
  return message.includes("activation") || message.includes("activate form");
}

function sent(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const value = (payload as Record<string, unknown>).success;
  return value === true || value === "true";
}

export async function submitContactMessage(
  input: ContactMessageInput,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<ContactDeliveryResult> {
  if (input.attachment && input.attachment.size > MAX_ATTACHMENT_BYTES) {
    return Object.freeze({ kind: "invalid" as const, reason: "attachment_too_large" as const });
  }

  try {
    const response = await fetchImpl(FORM_ENDPOINT, {
      method: "POST",
      headers: { accept: "application/json" },
      body: formDataFor(input),
    });

    if (!response.ok) return Object.freeze({ kind: "unavailable" as const });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return Object.freeze({ kind: "unavailable" as const });
    }

    if (sent(payload)) return Object.freeze({ kind: "sent" as const });
    if (needsActivation(payload)) return Object.freeze({ kind: "activation_required" as const });
    return Object.freeze({ kind: "unavailable" as const });
  } catch {
    return Object.freeze({ kind: "unavailable" as const });
  }
}
