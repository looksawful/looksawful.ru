export interface PetPreferenceState {
  permanentlyDisabled: boolean;
  temporaryHiddenUntil: number | null;
}

export type PetPreferenceEvent =
  | { type: "HIDE_TEMPORARILY"; now: number; cooldownMs: number }
  | { type: "AUTO_RETURN"; now: number }
  | { type: "DISABLE_PERMANENTLY" }
  | { type: "ENABLE" };

export function reducePetPreference(
  state: PetPreferenceState,
  event: PetPreferenceEvent,
): PetPreferenceState {
  switch (event.type) {
    case "HIDE_TEMPORARILY":
      if (state.permanentlyDisabled) return state;
      return {
        permanentlyDisabled: false,
        temporaryHiddenUntil: event.now + Math.max(0, event.cooldownMs),
      };
    case "AUTO_RETURN":
      if (state.permanentlyDisabled || state.temporaryHiddenUntil === null) return state;
      if (event.now < state.temporaryHiddenUntil) return state;
      return { permanentlyDisabled: false, temporaryHiddenUntil: null };
    case "DISABLE_PERMANENTLY":
      return { permanentlyDisabled: true, temporaryHiddenUntil: null };
    case "ENABLE":
      return { permanentlyDisabled: false, temporaryHiddenUntil: null };
  }
}
