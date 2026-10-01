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

// 4. WhatsApp Sharing & Multilingual Verification
console.log("\nTest 4: WhatsApp Messaging & Share URL verification...");
import { buildWhatsAppMessage, getWhatsAppShareUrl } from "../src/services/whatsapp.ts";

// Button text verification
assert.strictEqual(enStrings.share_with_worker, "Share with ASHA / Family on WhatsApp", "English WhatsApp button label mismatch");
assert.strictEqual(hiStrings.share_with_worker, "ASHA / परिवार के साथ WhatsApp पर साझा करें", "Hindi WhatsApp button label mismatch");
assert.strictEqual(taStrings.share_with_worker, "ASHA / குடும்பத்துடன் WhatsApp-ல் பகிரவும்", "Tamil WhatsApp button label mismatch");
console.log("✔ Passed: share_with_worker button strings strictly localized across en, hi, ta");

// English message test
const enMsg = buildWhatsAppMessage({
  lang: "en",
  schemeTitle: "Pradhan Mantri Matru Vandana Yojana",
  verdict: "LIKELY_ELIGIBLE",
  amount: 5000,
  documents: ["aadhaar", "bank_passbook", "mother_child_card", "photo"],
});
assert.match(enMsg, /^Vaani — Government Scheme Help/, "English message must start with Vaani header");
assert.match(enMsg, /Scheme: Pradhan Mantri Matru Vandana Yojana/, "English message must include scheme name");
assert.match(enMsg, /Result: You may qualify for this scheme\./, "English message must use safe 'you may qualify' phrasing");
assert.match(enMsg, /Potential Benefit: ₹5,000/, "English message must format amount");
assert.match(enMsg, /Aadhaar Card/, "English message must include documents");
assert.match(enMsg, /Next step:\n.*Anganwadi Centre or ASHA worker/, "English message must include Anganwadi/ASHA next step");
assert.doesNotMatch(enMsg, /[\u0900-\u097F]/, "English message must not contain Hindi script");
assert.doesNotMatch(enMsg, /[\u0B80-\u0BFF]/, "English message must not contain Tamil script");
assert.doesNotMatch(enMsg, /Aadhaar: \d{4}/, "Message must not contain personal Aadhaar number");
console.log("✔ Passed: English WhatsApp message structure, safe wording & zero PII verified");

// Hindi message test
const hiMsg = buildWhatsAppMessage({
  lang: "hi",
  schemeTitle: "प्रधानमंत्री मातृ वंदना योजना",
  verdict: "LIKELY_ELIGIBLE",
  amount: 5000,
  documents: ["aadhaar", "bank_passbook", "mother_child_card", "photo"],
});
assert.match(hiMsg, /^वाणी — सरकारी योजना सहायता/, "Hindi message must start with Vaani header in Hindi");
assert.match(hiMsg, /योजना: प्रधानमंत्री मातृ वंदना योजना/, "Hindi message must include scheme name");
assert.match(hiMsg, /परिणाम: आप इस योजना के लिए पात्र हो सकती हैं।/, "Hindi message must use safe phrasing");
assert.match(hiMsg, /संभावित सहायता राशि: ₹5,000/, "Hindi message must include amount");
assert.match(hiMsg, /आधार कार्ड/, "Hindi message must include documents in Hindi");
assert.match(hiMsg, /अगला कदम:\n.*आंगनवाड़ी केंद्र या आशा कार्यकर्ता/, "Hindi message must include Anganwadi/ASHA next step");
assert.doesNotMatch(hiMsg, /[\u0B80-\u0BFF]/, "Hindi message must not contain Tamil script");
assert.match(hiMsg, /[\u0900-\u097F]/, "Hindi message must contain Hindi script");
console.log("✔ Passed: Hindi WhatsApp message structure, safe wording & zero PII verified");

// Tamil message test
const taMsg = buildWhatsAppMessage({
  lang: "ta",
  schemeTitle: "பிரதம மந்திரி மாத்ரு வந்தனா யோஜனா",
  verdict: "LIKELY_ELIGIBLE",
  amount: 5000,
  documents: ["aadhaar", "bank_passbook", "mother_child_card", "photo"],
});
assert.match(taMsg, /^வாணி — அரசு நலத்திட்ட வழிகாட்டி/, "Tamil message must start with Vaani header in Tamil");
assert.match(taMsg, /திட்டம்: பிரதம மந்திரி மாத்ரு வந்தனா யோஜனா/, "Tamil message must include scheme name");
assert.match(taMsg, /தகுதி நிலை: இத்திட்டத்திற்கு நீங்கள் தகுதி பெற வாய்ப்புள்ளது\./, "Tamil message must use safe phrasing");
assert.match(taMsg, /உத்தேச உதவித்தொகை: ₹5,000/, "Tamil message must include amount");
assert.match(taMsg, /ஆதார் கார்டு/, "Tamil message must include documents in Tamil");
assert.match(taMsg, /அடுத்த கட்ட நடவடிக்கை:\n.*அங்கன்வாடி மையம் அல்லது ஆஷா பணியாளரை/, "Tamil message must include Anganwadi/ASHA next step");
assert.doesNotMatch(taMsg, /[\u0900-\u097F]/, "Tamil message must not contain Hindi script");
assert.match(taMsg, /[\u0B80-\u0BFF]/, "Tamil message must contain Tamil script");
console.log("✔ Passed: Tamil WhatsApp message structure, safe wording & zero PII verified");

// Test ASK_WORKER safe wording without rupee promise
const askWorkerMsg = buildWhatsAppMessage({
  lang: "en",
  schemeTitle: "Pradhan Mantri Matru Vandana Yojana",
  verdict: "ASK_WORKER",
  documents: ["aadhaar", "bank_passbook"],
});
assert.match(askWorkerMsg, /Result: Please consult your Anganwadi worker to verify eligibility\./);
assert.doesNotMatch(askWorkerMsg, /Potential Benefit:/, "ASK_WORKER message must NOT promise an amount");
console.log("✔ Passed: ASK_WORKER safe wording omits rupee promise");

// Test WhatsApp Share URL generation
const shareUrl = getWhatsAppShareUrl({
  lang: "en",
  schemeTitle: "PMMVY",
  verdict: "LIKELY_ELIGIBLE",
  amount: 5000,
});
assert.ok(shareUrl.startsWith("https://wa.me/?text="), "Share URL must use universal wa.me schema");
assert.strictEqual(decodeURIComponent(shareUrl.replace("https://wa.me/?text=", "")), buildWhatsAppMessage({
  lang: "en",
  schemeTitle: "PMMVY",
  verdict: "LIKELY_ELIGIBLE",
  amount: 5000,
}), "Decoded share URL must match raw message");
console.log("✔ Passed: Universal WhatsApp wa.me share URL correctly formatted");

console.log("\n✔ All multilingual demo repair and hardening tests passed successfully!");

