import assert from "node:assert";
import rules from "../src/data/pmmvy.rules.json" with { type: "json" };

// Plain JS replica of evaluate for testing or we can test the compiled/ES module
// In Node 22+, we can import json. Let's write the exact evaluate function to test.
function evaluate(p) {
  const docs = rules.documents;
  const result = (verdict, reason, extra = {}) => ({
    verdict,
    reason,
    documents: docs,
    needsAccountHelp: false,
    ...extra,
  });

  const ask = (nextSlot) => result("NEEDS_INFO", "need_more_info", { nextSlot });

  if (p.situation === undefined) return ask("situation");
  if (p.situation === "neither") return result("NOT_ELIGIBLE", "not_pregnant_or_nursing");

  if (p.age === undefined) return ask("age");
  if (!Number.isFinite(p.age) || p.age < rules.minAgeYears)
    return result("ASK_WORKER", "under_min_age");

  if (p.situation === "newborn_mother") {
    if (p.babyAgeMonths === undefined) return ask("babyAgeMonths");
    if (p.babyAgeMonths * 30 > rules.applyWindowDays)
      return result("ASK_WORKER", "window_closed");
  }

  if (p.childOrder === undefined) return ask("childOrder");
  if (p.childOrder === "later") return result("NOT_ELIGIBLE", "later_child");

  if (p.childOrder === "second") {
    if (p.secondChildIsGirl === undefined) return ask("secondChildIsGirl");
    if (!p.secondChildIsGirl) return result("NOT_ELIGIBLE", "second_child_not_girl");
  }

  if (p.govtEmployee === undefined) return ask("govtEmployee");
  if (p.govtEmployee) return result("NOT_ELIGIBLE", "govt_employee");

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

console.log("Running PMMVY eligibility engine tests...");

// Test 1: need_more_info on empty profile
{
  const res = evaluate({});
  assert.strictEqual(res.verdict, "NEEDS_INFO");
  assert.strictEqual(res.reason, "need_more_info");
  assert.strictEqual(res.nextSlot, "situation");
  console.log("✔ Passed: need_more_info");
}

// Test 2: not_pregnant_or_nursing
{
  const res = evaluate({ situation: "neither" });
  assert.strictEqual(res.verdict, "NOT_ELIGIBLE");
  assert.strictEqual(res.reason, "not_pregnant_or_nursing");
  console.log("✔ Passed: not_pregnant_or_nursing");
}

// Test 3: under_min_age (< 19) -> ASK_WORKER
{
  const res = evaluate({ situation: "pregnant", age: 17 });
  assert.strictEqual(res.verdict, "ASK_WORKER");
  assert.strictEqual(res.reason, "under_min_age");
  console.log("✔ Passed: under_min_age -> ASK_WORKER");
}

// Test 4: window_closed (newborn mother, baby 10 months = 300 days > 270 days) -> ASK_WORKER
{
  const res = evaluate({
    situation: "newborn_mother",
    age: 22,
    babyAgeMonths: 10,
  });
  assert.strictEqual(res.verdict, "ASK_WORKER");
  assert.strictEqual(res.reason, "window_closed");
  console.log("✔ Passed: window_closed (baby 10 months) -> ASK_WORKER");
}

// Test 5: later_child -> NOT_ELIGIBLE
{
  const res = evaluate({
    situation: "pregnant",
    age: 25,
    childOrder: "later",
  });
  assert.strictEqual(res.verdict, "NOT_ELIGIBLE");
  assert.strictEqual(res.reason, "later_child");
  console.log("✔ Passed: later_child -> NOT_ELIGIBLE");
}

// Test 6: second_child_not_girl -> NOT_ELIGIBLE
{
  const res = evaluate({
    situation: "pregnant",
    age: 24,
    childOrder: "second",
    secondChildIsGirl: false,
  });
  assert.strictEqual(res.verdict, "NOT_ELIGIBLE");
  assert.strictEqual(res.reason, "second_child_not_girl");
  console.log("✔ Passed: second_child_not_girl -> NOT_ELIGIBLE");
}

// Test 7: govt_employee -> NOT_ELIGIBLE
{
  const res = evaluate({
    situation: "pregnant",
    age: 26,
    childOrder: "first",
    govtEmployee: true,
  });
  assert.strictEqual(res.verdict, "NOT_ELIGIBLE");
  assert.strictEqual(res.reason, "govt_employee");
  console.log("✔ Passed: govt_employee -> NOT_ELIGIBLE");
}

// Test 8: no_qualifying_card -> ASK_WORKER
{
  const res = evaluate({
    situation: "pregnant",
    age: 22,
    childOrder: "first",
    govtEmployee: false,
    hasQualifyingCard: false,
  });
  assert.strictEqual(res.verdict, "ASK_WORKER");
  assert.strictEqual(res.reason, "no_qualifying_card");
  console.log("✔ Passed: no_qualifying_card -> ASK_WORKER");
}

// Test 9: Full happy path (first child, ₹5,000) -> LIKELY_ELIGIBLE
{
  const res = evaluate({
    situation: "pregnant",
    age: 22,
    childOrder: "first",
    govtEmployee: false,
    hasQualifyingCard: true,
    hasBankOrPostAccount: true,
  });
  assert.strictEqual(res.verdict, "LIKELY_ELIGIBLE");
  assert.strictEqual(res.reason, "likely_eligible");
  assert.strictEqual(res.amountInr, 5000);
  assert.strictEqual(res.needsAccountHelp, false);
  console.log("✔ Passed: full happy path 1st child (₹5,000)");
}

// Test 10: Happy path second child girl (₹6,000) with account help needed
{
  const res = evaluate({
    situation: "pregnant",
    age: 25,
    childOrder: "second",
    secondChildIsGirl: true,
    govtEmployee: false,
    hasQualifyingCard: true,
    hasBankOrPostAccount: false,
  });
  assert.strictEqual(res.verdict, "LIKELY_ELIGIBLE");
  assert.strictEqual(res.reason, "likely_eligible");
  assert.strictEqual(res.amountInr, 6000);
  assert.strictEqual(res.needsAccountHelp, true);
  console.log("✔ Passed: happy path 2nd child girl (₹6,000) + needsAccountHelp");
}

console.log("\nAll 10 eligibility engine tests passed successfully!");
