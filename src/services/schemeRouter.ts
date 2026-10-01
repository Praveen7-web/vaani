import central from "../data/schemes/central.schemes.json";
import state from "../data/schemes/state.schemes.json";
import type { Scheme, Intent, StateCode } from "../types";

const MAX_RESULTS = 3;

export function matchSchemes(
  intent: Intent,
  stateCode: StateCode | "OTHER" | undefined,
  opts: { showUnverified: boolean } = { showUnverified: false }
): Scheme[] {
  const centralHits = (central.schemes as unknown as Scheme[]).filter((s) =>
    s.intents.includes(intent)
  );

  const stateHits =
    stateCode && stateCode !== "OTHER"
      ? (
          (state.states as Record<string, { schemes: Scheme[] }>)[stateCode]
            ?.schemes ?? []
        ).filter((s) => s.intents.includes(intent))
      : [];

  const all = [...centralHits, ...stateHits].filter(
    (s) => opts.showUnverified || s.verification.status !== "unverified"
  );

  // Rank: deep-flow first, more-verified first, state before central
  const rank = (s: Scheme) =>
    (s.deepFlow ? 0 : 10) +
    (s.verification.status === "verified"
      ? 0
      : s.verification.status === "partially_verified"
        ? 2
        : 4) +
    (stateHits.includes(s) ? 0 : 1);

  return all.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_RESULTS);
}
