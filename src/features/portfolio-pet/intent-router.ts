export type PortfolioPetLocale = "ru" | "en";

export type PortfolioPetLocalAction =
  | "about"
  | "cases"
  | "resume"
  | "writer-email"
  | "writer-application"
  | "game";

export type PortfolioPetIntent =
  | { kind: "local"; action: PortfolioPetLocalAction }
  | { kind: "model"; action: "free-chat" };

export interface PortfolioPetIntentInput {
  message: string;
  locale: PortfolioPetLocale;
}

const normalizedExactRoutes: ReadonlyMap<string, PortfolioPetLocalAction> = new Map([
  ["кейсы", "cases"],
  ["проекты", "cases"],
  ["работы", "cases"],
  ["покажи кейсы", "cases"],
  ["покажи проекты", "cases"],
  ["покажи работы", "cases"],
  ["cases", "cases"],
  ["projects", "cases"],
  ["work", "cases"],
  ["show cases", "cases"],
  ["show projects", "cases"],
  ["резюме", "resume"],
  ["cv", "resume"],
  ["resume", "resume"],
  ["обо мне", "about"],
  ["кто такой иван", "about"],
  ["about", "about"],
  ["about ivan", "about"],
  ["написать письмо", "writer-email"],
  ["составь письмо", "writer-email"],
  ["write email", "writer-email"],
  ["write message", "writer-email"],
  ["составить заявку", "writer-application"],
  ["заявка", "writer-application"],
  ["application", "writer-application"],
  ["играть", "game"],
  ["игра", "game"],
  ["сыграем", "game"],
  ["play", "game"],
  ["game", "game"],
]);

function normalizeMessage(message: string): string {
  return message
    .trim()
    .toLocaleLowerCase()
    .replace(/[!?.,;:]+$/g, "")
    .replace(/\s+/g, " ");
}

export function routePortfolioPetIntent({ message }: PortfolioPetIntentInput): PortfolioPetIntent {
  const normalized = normalizeMessage(message);
  const localAction = normalizedExactRoutes.get(normalized);
  if (localAction) return { kind: "local", action: localAction };
  return { kind: "model", action: "free-chat" };
}
