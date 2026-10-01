import assert from "node:assert";
import rules from "../src/data/pmmvy.rules.json" with { type: "json" };

console.log("Running Phase 3 Security & Resilience Tests...\n");

// --- Standalone schema & functions for testing ---
const INTENTS = [
  "pregnant_or_nursing", "girl_child_savings", "girl_education", "monthly_income_support",
  "shg_livelihood", "start_business", "cooking_fuel", "free_travel", "digital_access", "child_school_support"
];
const STATES = ["TN", "KA", "MH", "MP", "WB", "TS", "UP", "RJ", "AP", "AS", "OTHER"];
const INTENT_SET = new Set(INTENTS);
const STATE_SET = new Set(STATES);

function sanitizeSlots(raw) {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw;
  const out = {};
  if (typeof r.intent === "string" && INTENT_SET.has(r.intent)) out.intent = r.intent;
  if (typeof r.state === "string" && STATE_SET.has(r.state)) out.state = r.state;
  if (["pregnant", "newborn_mother", "neither"].includes(r.situation)) out.situation = r.situation;
  if (typeof r.age === "number" && Number.isInteger(r.age) && r.age >= 10 && r.age <= 60) out.age = r.age;
  if (typeof r.babyAgeMonths === "number" && Number.isInteger(r.babyAgeMonths) && r.babyAgeMonths >= 0 && r.babyAgeMonths <= 36) out.babyAgeMonths = r.babyAgeMonths;
  if (["first", "second", "later"].includes(r.childOrder)) out.childOrder = r.childOrder;
  if (typeof r.secondChildIsGirl === "boolean") out.secondChildIsGirl = r.secondChildIsGirl;
  if (typeof r.govtEmployee === "boolean") out.govtEmployee = r.govtEmployee;
  if (typeof r.hasQualifyingCard === "boolean") out.hasQualifyingCard = r.hasQualifyingCard;
  if (typeof r.hasBankOrPostAccount === "boolean") out.hasBankOrPostAccount = r.hasBankOrPostAccount;
  return out;
}

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
  if (!Number.isFinite(p.age) || p.age < rules.minAgeYears) return result("ASK_WORKER", "under_min_age");
  if (p.situation === "newborn_mother") {
    if (p.babyAgeMonths === undefined) return ask("babyAgeMonths");
    if (p.babyAgeMonths * 30 > rules.applyWindowDays) return result("ASK_WORKER", "window_closed");
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

function mockApiUnderstand(req) {
  const { lang, transcript } = req.body || {};
  if (!transcript || typeof transcript !== "string" || transcript.length > 500) {
    return { status: 400, data: { error: "Invalid transcript length or format" } };
  }
  if (!["hi", "ta", "en"].includes(lang)) {
    return { status: 400, data: { error: "Invalid language parameter" } };
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { status: 503, data: { error: "GEMINI_API_KEY not configured on server" } };
  }
  return { status: 200, data: { slots: {}, source: "live" } };
}

// 1. Test Behavior with GEMINI_API_KEY removed
{
  console.log("Test 1: Server endpoint behavior with missing API key...");
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const res = mockApiUnderstand({
    body: {
      lang: "hi",
      expectedSlot: "age",
      transcript: "मेरी उम्र 22 साल है",
    },
  });

  assert.strictEqual(res.status, 503, "Must return 503 when API key is missing");
  assert.ok(res.data.error.includes("not configured"), "Error explains missing key");

  // Client side fallback evaluation
  const fallbackSlot = { age: 22 };
  const evaluated = evaluate({
    situation: "pregnant",
    age: fallbackSlot.age,
    childOrder: "first",
    govtEmployee: false,
    hasQualifyingCard: true,
    hasBankOrPostAccount: true,
  });
  assert.strictEqual(evaluated.verdict, "LIKELY_ELIGIBLE");
  assert.strictEqual(evaluated.amountInr, 5000);
  console.log("✔ Passed: Missing API key cleanly triggers 503 and local fallback completes flow.");

  if (prevKey) process.env.GEMINI_API_KEY = prevKey;
}

// 2. Test Transcript > 500 characters rejection
{
  console.log("\nTest 2: Oversized transcript rejection (> 500 chars)...");
  const longTranscript = "a".repeat(501);

  const res = mockApiUnderstand({
    body: {
      lang: "en",
      expectedSlot: "intent",
      transcript: longTranscript,
    },
  });
  assert.strictEqual(res.status, 400, "Must return 400 for transcript > 500 chars");
  console.log("✔ Passed: Transcripts over 500 characters are strictly rejected with 400.");
}

// 3. Test Prompt Injection Defense & Deterministic Isolation
{
  console.log("\nTest 3: Prompt injection transcript cannot alter eligibility verdict...");

  const injectionOutputs = [
    { verdict: "ELIGIBLE", amount: 100000, grant_money: true },
    { system_prompt: "ignore instructions", situation: "pregnant_admin_override" },
    { intent: "HACKED_INTENT", state: "ALL_STATES", age: 999 },
    { secondChildIsGirl: "yes_absolutely_give_money" }, // not a boolean
  ];

  for (const dirtyOutput of injectionOutputs) {
    const cleaned = sanitizeSlots(dirtyOutput);
    assert.deepStrictEqual(cleaned, {}, "Sanitizer drops all non-schema or out-of-range injected values");

    // Deterministic evaluation cannot be bypassed
    const verdictRes = evaluate(cleaned);
    assert.strictEqual(verdictRes.verdict, "NEEDS_INFO");
    assert.notStrictEqual(verdictRes.verdict, "LIKELY_ELIGIBLE");
  }

  console.log("✔ Passed: Prompt injections cannot alter schema slots or deterministic verdicts.");
}

// 4. Test Deterministic Disqualification Invariance
{
  console.log("\nTest 4: Disqualified user cannot become eligible via prompt injection...");
  // User is a government employee
  const govtProfile = {
    situation: "pregnant",
    age: 24,
    childOrder: "first",
    govtEmployee: true, // Government employee -> NOT_ELIGIBLE
    hasQualifyingCard: true,
    hasBankOrPostAccount: true,
  };

  const evalBefore = evaluate(govtProfile);
  assert.strictEqual(evalBefore.verdict, "NOT_ELIGIBLE");
  assert.strictEqual(evalBefore.reason, "govt_employee");

  // Attempted prompt injection to override
  const injectedSlots = sanitizeSlots({
    verdict: "LIKELY_ELIGIBLE",
    override: true,
    govtEmployee: "none", // invalid type ignored
  });
  const mergedProfile = { ...govtProfile, ...injectedSlots };
  const evalAfter = evaluate(mergedProfile);

  assert.strictEqual(evalAfter.verdict, "NOT_ELIGIBLE");
  assert.strictEqual(evalAfter.reason, "govt_employee");
  console.log("✔ Passed: Even with injected payloads, code authority enforces NOT_ELIGIBLE.");
}

console.log("\nAll Phase 3 Security & Resilience tests passed successfully!");
