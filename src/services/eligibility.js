import rules from "../data/pmmvy.rules.json" with { type: "json" };

const docs = rules.documents;

const result = (verdict, reason, extra = {}) => ({
  verdict,
  reason,
  documents: docs,
  needsAccountHelp: false,
  amount: extra.amountInr ?? 0,
  amountInr: extra.amountInr,
  ...extra,
});

export function evaluate(rawInput) {
  const p = { ...rawInput };

  // Normalize alternative property names if provided
  if (p.isPregnant !== undefined && p.situation === undefined) {
    p.situation = p.isPregnant ? "pregnant" : "newborn_mother";
  }
  if (p.daysSinceDelivery !== undefined && p.babyAgeMonths === undefined) {
    p.babyAgeMonths = Math.floor(p.daysSinceDelivery / 30);
  }
  if (p.firstChild !== undefined && p.childOrder === undefined) {
    p.childOrder = p.firstChild ? "first" : (p.secondChildGirl !== undefined ? "second" : "later");
  }
  if (p.secondChildGirl !== undefined && p.secondChildIsGirl === undefined) {
    p.secondChildIsGirl = p.secondChildGirl;
  }
  if (p.isGovtEmployee !== undefined && p.govtEmployee === undefined) {
    p.govtEmployee = p.isGovtEmployee;
  }
  if (p.isDisadvantaged !== undefined && p.hasQualifyingCard === undefined) {
    p.hasQualifyingCard = p.isDisadvantaged;
  }
  if (p.hasBankOrPostAccount === undefined && p.isDisadvantaged !== undefined) {
    p.hasBankOrPostAccount = true;
  }

  const ask = (nextSlot) =>
    result("NEEDS_INFO", "need_more_info", { nextSlot });

  if (p.situation === undefined) return ask("situation");
  if (p.situation === "neither")
    return result("NOT_ELIGIBLE", "not_pregnant_or_nursing");

  if (p.age === undefined) return ask("age");
  if (!Number.isFinite(p.age) || p.age < rules.minAgeYears)
    return result("ASK_WORKER", "under_min_age");

  if (p.situation === "newborn_mother") {
    if (p.babyAgeMonths === undefined && p.daysSinceDelivery === undefined) return ask("babyAgeMonths");
    const days = p.daysSinceDelivery !== undefined ? p.daysSinceDelivery : p.babyAgeMonths * 30;
    if (days > rules.applyWindowDays)
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

  if (p.hasQualifyingCard === undefined) return ask("hasQualifyingCard");
  if (!p.hasQualifyingCard) return result("ASK_WORKER", "no_qualifying_card");

  if (p.hasBankOrPostAccount === undefined) return ask("hasBankOrPostAccount");

  const benefit = rules.benefits.find((b) => b.childOrder === p.childOrder);
  if (!benefit) return result("ASK_WORKER", "need_more_info");

  return result("LIKELY_ELIGIBLE", "likely_eligible", {
    amount: benefit.amountInr,
    amountInr: benefit.amountInr,
    needsAccountHelp: !p.hasBankOrPostAccount,
  });
}
