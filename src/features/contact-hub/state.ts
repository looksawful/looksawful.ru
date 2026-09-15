export type ContactHubMode = "ai" | "form";
export type ContactHubVisibility = "closed" | "open" | "collapsed";
export type ContactHubEntryPoint = "pet" | "pet-direct" | "site-contact" | "collapsed-launcher";

export interface ContactHubState {
  visibility: ContactHubVisibility;
  mode: ContactHubMode;
  entryPoint: ContactHubEntryPoint | null;
  aiAvailable: boolean;
}

export type ContactHubEvent =
  | { type: "OPEN"; entryPoint: ContactHubEntryPoint }
  | { type: "SET_MODE"; mode: ContactHubMode }
  | { type: "COLLAPSE" }
  | { type: "RESTORE" }
  | { type: "CLOSE" }
  | { type: "SET_AI_AVAILABLE"; available: boolean };

export function createContactHubState(input: { aiAvailable: boolean }): ContactHubState {
  return {
    visibility: "closed",
    mode: "form",
    entryPoint: null,
    aiAvailable: input.aiAvailable,
  };
}

function modeForEntryPoint(entryPoint: ContactHubEntryPoint, currentMode: ContactHubMode): ContactHubMode {
  if (entryPoint === "pet") return "ai";
  if (entryPoint === "pet-direct" || entryPoint === "site-contact") return "form";
  return currentMode;
}

export function transitionContactHub(state: ContactHubState, event: ContactHubEvent): ContactHubState {
  switch (event.type) {
    case "OPEN":
      return {
        ...state,
        visibility: "open",
        mode: modeForEntryPoint(event.entryPoint, state.mode),
        entryPoint: event.entryPoint,
      };
    case "SET_MODE":
      return { ...state, mode: event.mode };
    case "COLLAPSE":
      return state.visibility === "open" ? { ...state, visibility: "collapsed" } : state;
    case "RESTORE":
      return state.visibility === "collapsed" ? { ...state, visibility: "open" } : state;
    case "CLOSE":
      return { ...state, visibility: "closed", entryPoint: null };
    case "SET_AI_AVAILABLE":
      return { ...state, aiAvailable: event.available };
  }
}
