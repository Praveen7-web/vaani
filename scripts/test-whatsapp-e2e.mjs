import assert from "node:assert";
import enStrings from "../src/i18n/en.json" with { type: "json" };
import hiStrings from "../src/i18n/hi.json" with { type: "json" };
import taStrings from "../src/i18n/ta.json" with { type: "json" };
import { buildWhatsAppMessage, getWhatsAppShareUrl } from "../src/services/whatsapp.ts";
import { evaluate } from "../src/services/eligibility.js";

console.log("=================================================");
console.log("   VAANI WHATSAPP MESSAGING INTEGRATION TEST     ");
console.log("=================================================\n");

// 1. Check Button Labels
console.log("1. Checking Handoff Card WhatsApp button labels:");
console.log(`   English: "${enStrings.share_with_worker}"`);
assert.strictEqual(enStrings.share_with_worker, "Share with ASHA / Family on WhatsApp");

console.log(`   Hindi:   "${hiStrings.share_with_worker}"`);
assert.strictEqual(hiStrings.share_with_worker, "ASHA / परिवार के साथ WhatsApp पर साझा करें");

console.log(`   Tamil:   "${taStrings.share_with_worker}"`);
assert.strictEqual(taStrings.share_with_worker, "ASHA / குடும்பத்துடன் WhatsApp-ல் பகிரவும்");
console.log("✔ Button text in all 3 languages matches requirements exactly.\n");

// 2. Check PMMVY Flow -> WhatsApp Message in English (First Child -> ₹5,000)
console.log("2. Simulating English PMMVY Completion (First Child):");
const pmmvyProfileEn = {
  intent: "pregnant_or_nursing",
  situation: "pregnant",
  age: 22,
  childOrder: "first",
  govtEmployee: false,
  hasQualifyingCard: true,
  hasBankOrPostAccount: true,
};
const evalEn = evaluate(pmmvyProfileEn);
assert.strictEqual(evalEn.verdict, "LIKELY_ELIGIBLE");
assert.strictEqual(evalEn.amountInr, 5000);

const shareMsgEn = buildWhatsAppMessage({
  lang: "en",
  schemeTitle: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
  verdict: evalEn.verdict,
  amount: evalEn.amountInr,
  documents: evalEn.documents,
});
console.log("--- ENGLISH MESSAGE PREVIEW ---");
console.log(shareMsgEn);
console.log("-------------------------------");

assert.ok(shareMsgEn.includes("Vaani — Government Scheme Help"));
assert.ok(shareMsgEn.includes("Scheme: Pradhan Mantri Matru Vandana Yojana (PMMVY)"));
assert.ok(shareMsgEn.includes("Result: You may qualify for this scheme."));
assert.ok(shareMsgEn.includes("Potential Benefit: ₹5,000"));
assert.ok(shareMsgEn.includes("- Aadhaar Card"));
assert.ok(shareMsgEn.includes("- Bank / Post Passbook"));
assert.ok(shareMsgEn.includes("- Mother & Child Card (MCP)"));
// Passport photos must NOT be in the message
assert.doesNotMatch(shareMsgEn, /Passport Photo/i);
assert.ok(shareMsgEn.includes("Next step:"));
assert.ok(shareMsgEn.includes("Anganwadi Centre or ASHA worker"));
// Verify NO PII
assert.doesNotMatch(shareMsgEn, /\b\d{12}\b/);
assert.doesNotMatch(shareMsgEn, /password|otp|pin|secret/i);
// Verify NO other languages
assert.doesNotMatch(shareMsgEn, /[\u0900-\u097F]/);
assert.doesNotMatch(shareMsgEn, /[\u0B80-\u0BFF]/);
console.log("✔ English WhatsApp message matches all requirements.\n");

// 3. Check PMMVY Flow -> WhatsApp Message in Hindi (First Child -> ₹5,000)
console.log("3. Simulating Hindi PMMVY Completion (First Child):");
const pmmvyProfileHi = {
  intent: "pregnant_or_nursing",
  situation: "pregnant",
  age: 22,
  childOrder: "first",
  govtEmployee: false,
  hasQualifyingCard: true,
  hasBankOrPostAccount: true,
};
const evalHi = evaluate(pmmvyProfileHi);
assert.strictEqual(evalHi.verdict, "LIKELY_ELIGIBLE");
assert.strictEqual(evalHi.amountInr, 5000);

const shareMsgHi = buildWhatsAppMessage({
  lang: "hi",
  schemeTitle: "प्रधानमंत्री मातृ वंदना योजना (PMMVY)",
  verdict: evalHi.verdict,
  amount: evalHi.amountInr,
  documents: evalHi.documents,
});
console.log("--- HINDI MESSAGE PREVIEW ---");
console.log(shareMsgHi);
console.log("-----------------------------");

assert.ok(shareMsgHi.includes("वाणी — सरकारी योजना सहायता"));
assert.ok(shareMsgHi.includes("योजना: प्रधानमंत्री मातृ वंदना योजना (PMMVY)"));
assert.ok(shareMsgHi.includes("परिणाम: आप इस योजना के लिए पात्र हो सकती हैं।"));
assert.ok(shareMsgHi.includes("संभावित सहायता राशि: ₹5,000"));
assert.ok(shareMsgHi.includes("- आधार कार्ड"));
assert.ok(shareMsgHi.includes("- बैंक / डाकघर पासबुक"));
assert.ok(shareMsgHi.includes("- मातृ एवं शिशु सुरक्षा कार्ड (MCP)"));
// Passport photos must NOT be in the message
assert.doesNotMatch(shareMsgHi, /पासपोर्ट फोटो/);
assert.ok(shareMsgHi.includes("अगला कदम:"));
assert.ok(shareMsgHi.includes("आंगनवाड़ी केंद्र या आशा कार्यकर्ता"));
assert.doesNotMatch(shareMsgHi, /[\u0B80-\u0BFF]/);
console.log("✔ Hindi WhatsApp message matches all requirements.\n");

// 4. Check PMMVY Flow -> WhatsApp Message in Tamil (SAME First Child Scenario -> ₹5,000)
console.log("4. Simulating Tamil PMMVY Completion (SAME First Child Scenario):");
const pmmvyProfileTa = {
  intent: "pregnant_or_nursing",
  situation: "pregnant",
  age: 22,
  childOrder: "first",
  govtEmployee: false,
  hasQualifyingCard: true,
  hasBankOrPostAccount: true,
};
const evalTa = evaluate(pmmvyProfileTa);
assert.strictEqual(evalTa.verdict, "LIKELY_ELIGIBLE");
// Deterministic engine must return ₹5,000 for the identical first child profile
assert.strictEqual(evalTa.amountInr, 5000);

const shareMsgTa = buildWhatsAppMessage({
  lang: "ta",
  schemeTitle: "பிரதம மந்திரி மாத்ரு வந்தனா யோஜனா (PMMVY)",
  verdict: evalTa.verdict,
  amount: evalTa.amountInr,
  documents: evalTa.documents,
});
console.log("--- TAMIL MESSAGE PREVIEW ---");
console.log(shareMsgTa);
console.log("-----------------------------");

assert.ok(shareMsgTa.includes("வாணி — அரசு நலத்திட்ட வழிகாட்டி"));
assert.ok(shareMsgTa.includes("திட்டம்: பிரதம மந்திரி மாத்ரு வந்தனா யோஜனா (PMMVY)"));
assert.ok(shareMsgTa.includes("தகுதி நிலை: இத்திட்டத்திற்கு நீங்கள் தகுதி பெற வாய்ப்புள்ளது."));
// Must say ₹5,000 for the first child
assert.ok(shareMsgTa.includes("உத்தேச உதவித்தொகை: ₹5,000"));
assert.ok(shareMsgTa.includes("- ஆதார் கார்டு"));
assert.ok(shareMsgTa.includes("- வங்கி / அஞ்சலக பாஸ்புக்"));
assert.ok(shareMsgTa.includes("- தாய் சேய் நல அட்டை (MCP)"));
// Passport photos must NOT be in the message
assert.doesNotMatch(shareMsgTa, /பாஸ்போர்ட் அளவு புகைப்படம்/);
assert.ok(shareMsgTa.includes("அடுத்த கட்ட நடவடிக்கை:"));
assert.ok(shareMsgTa.includes("அங்கன்வாடி மையம் அல்லது ஆஷா பணியாளரை"));
assert.doesNotMatch(shareMsgTa, /[\u0900-\u097F]/);
console.log("✔ Tamil WhatsApp message matches all requirements (same ₹5,000 benefit & MCP naming).\n");

// 5. Test Click-to-Chat URLs
console.log("5. Testing WhatsApp Click-to-Chat URLs:");
for (const lang of ["en", "hi", "ta"]) {
  const url = getWhatsAppShareUrl({
    lang,
    schemeTitle: "PMMVY",
    verdict: "LIKELY_ELIGIBLE",
    amount: 5000,
  });
  assert.ok(url.startsWith("https://wa.me/?text="), `${lang} share URL must use https://wa.me/?text=`);
  assert.ok(url.length > 30, `${lang} share URL must contain encoded content`);
  const decoded = decodeURIComponent(url.replace("https://wa.me/?text=", ""));
  assert.ok(decoded.includes(lang === "hi" ? "वाणी" : lang === "ta" ? "வாணி" : "Vaani"));
  console.log(`   ${lang.toUpperCase()} URL: ${url.substring(0, 50)}...`);
}
console.log("✔ Click-to-chat URLs validated across all 3 languages.\n");

// 6. Test ASK_WORKER safe wording
console.log("6. Testing ASK_WORKER safe wording (No firm rupee promise):");
const askWorkerProfile = {
  intent: "pregnant_or_nursing",
  situation: "pregnant",
  age: 18, // under 19
  childOrder: "first",
  govtEmployee: false,
  hasQualifyingCard: true,
  hasBankOrPostAccount: true,
};
const evalAsk = evaluate(askWorkerProfile);
assert.strictEqual(evalAsk.verdict, "ASK_WORKER");

const askMsgEn = buildWhatsAppMessage({
  lang: "en",
  schemeTitle: "PMMVY",
  verdict: evalAsk.verdict,
  documents: evalAsk.documents,
});
assert.ok(askMsgEn.includes("Result: Please consult your Anganwadi worker to verify eligibility."));
assert.ok(!askMsgEn.includes("Potential Benefit:"));
console.log("✔ ASK_WORKER properly omits rupee promise and refers user to worker.\n");

// 7. Verify Cross-Language Deterministic Parity (SAME scenario -> SAME amount)
console.log("7. Verifying Cross-Language Deterministic Parity (SAME scenario -> SAME amount):");
const scenarios = [
  {
    name: "1st Living Child",
    profile: {
      intent: "pregnant_or_nursing",
      situation: "pregnant",
      age: 22,
      childOrder: "first",
      govtEmployee: false,
      hasQualifyingCard: true,
      hasBankOrPostAccount: true,
    },
    expectedAmount: 5000,
  },
  {
    name: "2nd Child (Girl)",
    profile: {
      intent: "pregnant_or_nursing",
      situation: "pregnant",
      age: 25,
      childOrder: "second",
      secondChildIsGirl: true,
      govtEmployee: false,
      hasQualifyingCard: true,
      hasBankOrPostAccount: true,
    },
    expectedAmount: 6000,
  },
];

for (const sc of scenarios) {
  const evalResult = evaluate(sc.profile);
  assert.strictEqual(
    evalResult.amountInr,
    sc.expectedAmount,
    `${sc.name} must evaluate to ₹${sc.expectedAmount}`
  );

  const en = buildWhatsAppMessage({
    lang: "en",
    schemeTitle: "PMMVY",
    verdict: evalResult.verdict,
    amount: evalResult.amountInr,
  });
  const hi = buildWhatsAppMessage({
    lang: "hi",
    schemeTitle: "PMMVY",
    verdict: evalResult.verdict,
    amount: evalResult.amountInr,
  });
  const ta = buildWhatsAppMessage({
    lang: "ta",
    schemeTitle: "PMMVY",
    verdict: evalResult.verdict,
    amount: evalResult.amountInr,
  });

  const formattedAmount = `₹${sc.expectedAmount.toLocaleString("en-IN")}`;
  assert.ok(
    en.includes(formattedAmount),
    `English message must contain ${formattedAmount} for ${sc.name}`
  );
  assert.ok(
    hi.includes(formattedAmount),
    `Hindi message must contain ${formattedAmount} for ${sc.name}`
  );
  assert.ok(
    ta.includes(formattedAmount),
    `Tamil message must contain ${formattedAmount} for ${sc.name}`
  );
  console.log(`   ✔ ${sc.name}: EN, HI, and TA all contain ${formattedAmount} identically.`);
}
console.log("✔ Verified: Benefit amounts are never hardcoded by language and strictly originate from deterministic rule engine.\n");

console.log("ALL WHATSAPP INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n");
