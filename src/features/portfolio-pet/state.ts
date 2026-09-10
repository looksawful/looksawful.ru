export type PortfolioPetView =
  | "closed"
  | "home"
  | "about"
  | "cases"
  | "resume"
  | "writer-email"
  | "writer-application"
  | "free-chat"
  | "game"
  | "loading"
  | "error";

export type PortfolioPetAnimationState =
  | "idle"
  | "open"
  | "think"
  | "speak"
  | "success"
  | "error"
  | "run"
  | "jump"
  | "fall";

export interface PortfolioPetState {
  view: PortfolioPetView;
  pet: PortfolioPetAnimationState;
}

export type PortfolioPetStateEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SHOW"; view: Exclude<PortfolioPetView, "closed" | "loading" | "error"> }
  | { type: "AI_START" }
  | { type: "AI_SUCCESS" }
  | { type: "AI_ERROR" }
  | { type: "GAME_RUN" }
  | { type: "GAME_JUMP" }
  | { type: "GAME_FALL" };

export function createPortfolioPetState(): PortfolioPetState {
  return { view: "closed", pet: "idle" };
}

export function reducePortfolioPetState(
  current: PortfolioPetState,
  event: PortfolioPetStateEvent,
): PortfolioPetState {
  switch (event.type) {
    case "OPEN":
      return { view: "home", pet: "open" };
    case "CLOSE":
      return { view: "closed", pet: "idle" };
    case "SHOW":
      return { view: event.view, pet: "open" };
    case "AI_START":
      return { view: "loading", pet: "think" };
    case "AI_SUCCESS":
      return { view: "free-chat", pet: "speak" };
    case "AI_ERROR":
      return { view: "error", pet: "error" };
    case "GAME_RUN":
      return { view: "game", pet: "run" };
    case "GAME_JUMP":
      return { view: "game", pet: "jump" };
    case "GAME_FALL":
      return { view: "game", pet: "fall" };
    default:
      return current;
  }
}
