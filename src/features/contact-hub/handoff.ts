import type { ContactFormDraft } from "./form-contract.ts";

export type HandoffMessageStrategy = "append" | "replace";

export type AiDraftHandoffResult =
  | { kind: "no_draft" }
  | {
      kind: "needs_message_decision";
      currentMessage: string;
      incomingMessage: string;
    }
  | {
      kind: "ready";
      draft: ContactFormDraft;
    };

export function applyExplicitAiDraftHandoff({
  selectedDraftText,
  formDraft,
  messageStrategy,
}: {
  selectedDraftText: string;
  formDraft: ContactFormDraft;
  messageStrategy?: HandoffMessageStrategy;
}): AiDraftHandoffResult {
  if (!selectedDraftText.trim()) {
    return Object.freeze({ kind: "no_draft" as const });
  }

  const currentMessage = formDraft.message;
  if (currentMessage.trim() && !messageStrategy) {
    return Object.freeze({
      kind: "needs_message_decision" as const,
      currentMessage,
      incomingMessage: selectedDraftText,
    });
  }

  const message = messageStrategy === "append" && currentMessage.trim()
    ? `${currentMessage}\n\n${selectedDraftText}`
    : selectedDraftText;

  return Object.freeze({
    kind: "ready" as const,
    draft: Object.freeze({
      name: formDraft.name,
      email: formDraft.email,
      message,
    }),
  });
}
