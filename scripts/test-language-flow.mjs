import assert from "node:assert";
import hiStrings from "../src/i18n/hi.json" with { type: "json" };
import taStrings from "../src/i18n/ta.json" with { type: "json" };
import enStrings from "../src/i18n/en.json" with { type: "json" };
import { DEMO_SCENARIOS, getScenarioTitle, getScenarioSubtitle, getStepUtterance } from "../src/data/demoScenarios.ts";
import { getVoiceLocale } from "../src/services/voice.ts";
import { localParse } from "../src/services/localParse.ts";
import { evaluate } from "../src/services/eligibility.js";

console.log("Running Final Multilingual & Demo Hardening Verification...\n");

// 1. TTS Voice Locale Mapping Verification
console.log("Test 1: TTS getVoiceLocale mapping...");
assert.strictEqual(getVoiceLocale("hi"), "hi-IN", "hi must map to hi-IN");
assert.strictEqual(getVoiceLocale("ta"), "ta-IN", "ta must map to ta-IN");
assert.strictEqual(getVoiceLocale("en"), "en-IN", "en must map to en-IN");
console.log("✔ Passed: getVoiceLocale correctly maps hi->hi-IN, ta->ta-IN, en->en-IN\n");

// 2. Complete String Table Parity Check
console.log("Test 2: i18n string table completeness...");
const criticalKeys = [
  "greeting",
  "safety_notice",
  "ask_intent",
  "ask_state",
  "ask_situation",
  "ask_age",
  "ask_child_order",
  "confirm_template",
  "result_likely_eligible",
  "handoff_card_title",
  "you_may_qualify",
  "documents_to_carry",
  "go_to_anganwadi",
  "call_181",
  "share_with_worker",
  "private_badge",
  "auto_speak_next",
  "demo_badge",
  "select_demo_scenario",
  "about",
  "scheme_pmmvy_name",
  "scheme_pmmvy_benefit",
];

for (const key of criticalKeys) {
  assert.ok(hiStrings[key], `Missing Hindi key: ${key}`);
  assert.ok(taStrings[key], `Missing Tamil key: ${key}`);
  assert.ok(enStrings[key], `Missing English key: ${key}`);
}
console.log(`✔ Passed: All ${criticalKeys.length} critical keys present in hi, ta, and en tables\n`);

// 3. Multilingual Demo Simulation for ALL Scenarios
console.log("Test 3: Demo Scenarios execution across Hindi, Tamil, and English...");

const testLangs = ["hi", "ta", "en"];

for (const sc of DEMO_SCENARIOS) {
  console.log(`\nScenario: "${sc.id}"`);
  for (const lang of testLangs) {
    const title = getScenarioTitle(sc, lang);
    const subtitle = getScenarioSubtitle(sc, lang);
    assert.ok(title && title.length > 3, `Title missing for ${lang} in ${sc.id}`);
    assert.ok(subtitle && subtitle.length > 3, `Subtitle missing for ${lang} in ${sc.id}`);

    const profile = {};
    for (const step of sc.steps) {
      const utterance = getStepUtterance(step, lang);
      assert.ok(utterance && utterance.length > 0, `Missing utterance for slot ${step.slot} in ${lang}`);

      const parsed = localParse(step.slot, utterance, lang);
      assert.notStrictEqual(
        parsed[step.slot],
        undefined,
        `localParse failed to extract slot "${step.slot}" from utterance "${utterance}" in language "${lang}"`
      );

      profile[step.slot] = parsed[step.slot];
    }

    const result = evaluate(profile);
    assert.ok(result.verdict, `Expected valid verdict for ${lang} in ${sc.id}`);

    // Verify string table resolution has no cross-language pollution
    const stringTable = lang === "hi" ? hiStrings : lang === "ta" ? taStrings : enStrings;
    const greeting = stringTable.greeting;

    if (lang === "ta") {
      assert.match(greeting, /[\u0B80-\u0BFF]/, "Tamil prompt must contain Tamil unicode");
      assert.doesNotMatch(greeting, /[\u0900-\u097F]/, "Tamil prompt must NOT contain Hindi/Devanagari characters");
    } else if (lang === "en") {
      assert.doesNotMatch(greeting, /[\u0900-\u097F]/, "English prompt must NOT contain Hindi/Devanagari characters");
      assert.doesNotMatch(greeting, /[\u0B80-\u0BFF]/, "English prompt must NOT contain Tamil characters");
    } else if (lang === "hi") {
      assert.match(greeting, /[\u0900-\u097F]/, "Hindi prompt must contain Hindi/Devanagari unicode");
    }

    console.log(`  ✔ [${lang.toUpperCase()}] ${sc.id} passed: parsed -> ${result.verdict} (${result.amountInr ? `₹${result.amountInr}` : result.reason})`);
  }
}

console.log("\n✔ All multilingual demo repair and hardening tests passed successfully!");
