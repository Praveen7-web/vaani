import type { Lang, Profile, Scheme, SlotKey, StateCode, Intent } from "../types";
import { evaluate } from "../services/eligibility";
import { matchSchemes } from "../services/schemeRouter";
import { isSpeechRecognitionSupported } from "../services/voice";

export type Step =
  | "LANGUAGE_PICK"
  | "GREETING_AND_SAFETY"
  | "ASK_INTENT"
  | "ASK_STATE"
  | "ASK_SLOT"
  | "CONFIRM_SLOT"
  | "PMMVY_RESULT"
  | "DISCOVERY_CARDS"
  | "DONE";

export interface PendingSlot {
  key: SlotKey;
  value: any;
  displayValue: string;
}

export interface ConversationState {
  lang: Lang;
  step: Step;
  profile: Partial<Profile>;
  pendingSlot: PendingSlot | null;
  returnStep: Step | null; // where to go back if confirm is rejected
  currentSlot: SlotKey | null;
  discoveryIndex: number;
  discoveryList: Scheme[];
  failedAttempts: Record<string, number>;
  forceTaps: boolean;
  isListening: boolean;
  transcript: string;
  speechSupported: boolean;
}

export type ConversationAction =
  | { type: "SET_LANGUAGE"; payload: Lang }
  | { type: "ACKNOWLEDGE_GREETING" }
  | { type: "PROPOSE_SLOT"; payload: PendingSlot }
  | { type: "CONFIRM_SLOT_YES" }
  | { type: "CONFIRM_SLOT_NO" }
  | { type: "NEXT_DISCOVERY_CARD" }
  | { type: "VIEW_COMPANION_SCHEMES" }
  | { type: "START_OVER" }
  | { type: "SET_LISTENING"; payload: boolean }
  | { type: "SET_TRANSCRIPT"; payload: string }
  | { type: "RECORD_FAILED_ATTEMPT"; payload: string };

export const initialState: ConversationState = {
  lang: "hi",
  step: "LANGUAGE_PICK",
  profile: {},
  pendingSlot: null,
  returnStep: null,
  currentSlot: null,
  discoveryIndex: 0,
  discoveryList: [],
  failedAttempts: {},
  forceTaps: !isSpeechRecognitionSupported(),
  isListening: false,
  transcript: "",
  speechSupported: isSpeechRecognitionSupported(),
};

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "SET_LANGUAGE": {
      return {
        ...state,
        lang: action.payload,
        step: "GREETING_AND_SAFETY",
      };
    }

    case "ACKNOWLEDGE_GREETING": {
      return {
        ...state,
        step: "ASK_INTENT",
        currentSlot: "intent",
      };
    }

    case "PROPOSE_SLOT": {
      return {
        ...state,
        pendingSlot: action.payload,
        returnStep: state.step,
        step: "CONFIRM_SLOT",
        isListening: false,
      };
    }

    case "CONFIRM_SLOT_NO": {
      return {
        ...state,
        pendingSlot: null,
        step: state.returnStep || "ASK_INTENT",
        isListening: false,
      };
    }

    case "CONFIRM_SLOT_YES": {
      if (!state.pendingSlot) return state;

      const updatedProfile: Partial<Profile> = {
        ...state.profile,
        [state.pendingSlot.key]: state.pendingSlot.value,
      };

      const answeredKey = state.pendingSlot.key;

      // 1. After confirming INTENT -> move to ASK_STATE
      if (answeredKey === "intent") {
        return {
          ...state,
          profile: updatedProfile,
          pendingSlot: null,
          step: "ASK_STATE",
          currentSlot: "state",
        };
      }

      // 2. After confirming STATE
      if (answeredKey === "state") {
        if (updatedProfile.intent === "pregnant_or_nursing") {
          // Check PMMVY eligibility evaluation
          const evalResult = evaluate(updatedProfile);
          if (evalResult.verdict === "NEEDS_INFO" && evalResult.nextSlot) {
            return {
              ...state,
              profile: updatedProfile,
              pendingSlot: null,
              step: "ASK_SLOT",
              currentSlot: evalResult.nextSlot,
            };
          } else {
            return {
              ...state,
              profile: updatedProfile,
              pendingSlot: null,
              step: "PMMVY_RESULT",
              currentSlot: null,
            };
          }
        } else {
          // Other intent: get discovery cards (excluding deepFlow)
          const matched = matchSchemes(
            updatedProfile.intent as Intent,
            updatedProfile.state as StateCode,
            { showUnverified: false }
          ).filter((s) => !s.deepFlow);

          if (matched.length > 0) {
            return {
              ...state,
              profile: updatedProfile,
              pendingSlot: null,
              step: "DISCOVERY_CARDS",
              discoveryList: matched,
              discoveryIndex: 0,
              currentSlot: null,
            };
          } else {
            return {
              ...state,
              profile: updatedProfile,
              pendingSlot: null,
              step: "DONE",
              currentSlot: null,
            };
          }
        }
      }

      // 3. After confirming a PMMVY question slot
      if (state.step === "CONFIRM_SLOT" && state.returnStep === "ASK_SLOT") {
        const evalResult = evaluate(updatedProfile);
        if (evalResult.verdict === "NEEDS_INFO" && evalResult.nextSlot) {
          return {
            ...state,
            profile: updatedProfile,
            pendingSlot: null,
            step: "ASK_SLOT",
            currentSlot: evalResult.nextSlot,
          };
        } else {
          return {
            ...state,
            profile: updatedProfile,
            pendingSlot: null,
            step: "PMMVY_RESULT",
            currentSlot: null,
          };
        }
      }

      return {
        ...state,
        profile: updatedProfile,
        pendingSlot: null,
      };
    }

    case "VIEW_COMPANION_SCHEMES": {
      // Check for companion schemes (e.g. Telangana Arogya Lakshmi)
      const companion = matchSchemes(
        "pregnant_or_nursing",
        state.profile.state,
        { showUnverified: false }
      ).filter((s) => !s.deepFlow);

      if (companion.length > 0) {
        return {
          ...state,
          step: "DISCOVERY_CARDS",
          discoveryList: companion,
          discoveryIndex: 0,
        };
      }
      return {
        ...state,
        step: "DONE",
      };
    }

    case "NEXT_DISCOVERY_CARD": {
      const nextIdx = state.discoveryIndex + 1;
      if (nextIdx < state.discoveryList.length) {
        return {
          ...state,
          discoveryIndex: nextIdx,
        };
      }
      return {
        ...state,
        step: "DONE",
      };
    }

    case "RECORD_FAILED_ATTEMPT": {
      const slot = action.payload;
      const count = (state.failedAttempts[slot] || 0) + 1;
      return {
        ...state,
        failedAttempts: {
          ...state.failedAttempts,
          [slot]: count,
        },
        forceTaps: count >= 2 ? true : state.forceTaps,
      };
    }

    case "SET_LISTENING": {
      return {
        ...state,
        isListening: action.payload,
      };
    }

    case "SET_TRANSCRIPT": {
      return {
        ...state,
        transcript: action.payload,
      };
    }

    case "START_OVER": {
      return {
        ...initialState,
        lang: state.lang,
        forceTaps: !isSpeechRecognitionSupported(),
      };
    }

    default:
      return state;
  }
}
