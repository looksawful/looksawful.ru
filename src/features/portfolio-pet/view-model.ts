import type { PortfolioPetLocalAction, PortfolioPetLocale } from "./intent-router.ts";

export interface PortfolioPetQuickAction {
  id: PortfolioPetLocalAction;
  label: string;
  execution: "local";
}

export interface PortfolioPetShellCopy {
  accessibleName: string;
  closeLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  submitLabel: string;
}

const quickActions: Readonly<Record<PortfolioPetLocale, readonly PortfolioPetQuickAction[]>> = {
  ru: Object.freeze([
    { id: "about", label: "Обо мне", execution: "local" },
    { id: "cases", label: "Кейсы", execution: "local" },
    { id: "resume", label: "Резюме", execution: "local" },
    { id: "writer-email", label: "Написать письмо", execution: "local" },
    { id: "writer-application", label: "Составить заявку", execution: "local" },
    { id: "game", label: "Играть", execution: "local" },
  ]),
  en: Object.freeze([
    { id: "about", label: "About", execution: "local" },
    { id: "cases", label: "Cases", execution: "local" },
    { id: "resume", label: "Resume", execution: "local" },
    { id: "writer-email", label: "Write a message", execution: "local" },
    { id: "writer-application", label: "Application", execution: "local" },
    { id: "game", label: "Play", execution: "local" },
  ]),
};

const shellCopy: Readonly<Record<PortfolioPetLocale, PortfolioPetShellCopy>> = {
  ru: Object.freeze({
    accessibleName: "Открыть помощника по портфолио",
    closeLabel: "Закрыть",
    inputLabel: "Задать вопрос",
    inputPlaceholder: "Спроси о работе, опыте или кейсах",
    submitLabel: "Отправить",
  }),
  en: Object.freeze({
    accessibleName: "Open portfolio assistant",
    closeLabel: "Close",
    inputLabel: "Ask a question",
    inputPlaceholder: "Ask about work, experience, or cases",
    submitLabel: "Send",
  }),
};

export function getPortfolioPetQuickActions(
  locale: PortfolioPetLocale,
): readonly PortfolioPetQuickAction[] {
  return quickActions[locale];
}

export function getPortfolioPetShellCopy(locale: PortfolioPetLocale): PortfolioPetShellCopy {
  return shellCopy[locale];
}
