import rules from "../data/pmmvy.rules.json";
import type {
  Profile,
  EligibilityResult,
  DocKey,
  ReasonKey,
  SlotKey,
  Verdict,
} from "../types";

const docs = rules.documents as DocKey[];

const result = (
  verdict: Verdict,
  reason: ReasonKey,
  extra: Partial<EligibilityResult> = {},
): EligibilityResult => ({
  verdict,
  reason,
  documents: docs,
  needsAccountHelp: false,
  ...extra,
});

export function evaluate(p: Partial<Profile>): EligibilityResult {
  const ask = (nextSlot: SlotKey) =>
    result("NEEDS_INFO", "need_more_info", { nextSlot });

  if (p.situation === undefined) return ask("situation");
  if (p.situation === "neither")
    return result("NOT_ELIGIBLE", "not_pregnant_or_nursing");

  if (p.age === undefined) return ask("age");
  // Age rule: under minAgeYears routes to worker, never a flat "no"
  if (!Number.isFinite(p.age) || p.age < rules.minAgeYears)
    return result("ASK_WORKER", "under_min_age");

  if (p.situation === "newborn_mother") {
    if (p.babyAgeMonths === undefined) return ask("babyAgeMonths");
    // approximate (30-day months). Beyond the 270-day window: worker may know exceptions
    if (p.babyAgeMonths * 30 > rules.applyWindowDays)
      return result("ASK_WORKER", "window_closed");
  }

  if (p.childOrder === undefined) return ask("childOrder");
  if (p.childOrder === "later") return result("NOT_ELIGIBLE", "later_child");

  if (p.childOrder === "second") {
    if (p.secondChildIsGirl === undefined) return ask("secondChildIsGirl");
    if (!p.secondChildIsGirl)
      return result("NOT_ELIGIBLE", "second_child_not_girl");
  }

  if (p.govtEmployee === undefined) return ask("govtEmployee");
  if (p.govtEmployee) return result("NOT_ELIGIBLE", "govt_employee");

  // Disadvantaged-group criterion: "no card" routes to worker
  if (p.hasQualifyingCard === undefined) return ask("hasQualifyingCard");
  if (!p.hasQualifyingCard) return result("ASK_WORKER", "no_qualifying_card");

  if (p.hasBankOrPostAccount === undefined) return ask("hasBankOrPostAccount");

  const benefit = rules.benefits.find((b) => b.childOrder === p.childOrder);
  if (!benefit) return result("ASK_WORKER", "need_more_info");

  return result("LIKELY_ELIGIBLE", "likely_eligible", {
    amountInr: benefit.amountInr,
    needsAccountHelp: !p.hasBankOrPostAccount,
  });
}
