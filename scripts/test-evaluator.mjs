import { evaluate } from '../src/services/eligibility.js';

const evaluatorMatrix = [
  {
    desc: "TC-01: 1st Child rural mother -> ₹5,000 in 2 installments",
    profile: { age: 22, isPregnant: true, firstChild: true, isGovtEmployee: false, isDisadvantaged: true },
    expectedVerdict: "LIKELY_ELIGIBLE",
    expectedAmount: 5000
  },
  {
    desc: "TC-02: 2nd Child (Boy) -> NOT_ELIGIBLE (PMMVY 2.0 strictly requires girl for 2nd child)",
    profile: { age: 24, isPregnant: false, daysSinceDelivery: 45, firstChild: false, secondChildGirl: false, isGovtEmployee: false, isDisadvantaged: true },
    expectedVerdict: "NOT_ELIGIBLE",
    expectedAmount: 0
  },
  {
    desc: "TC-03: 2nd Child (Girl) -> ₹6,000 single installment",
    profile: { age: 24, isPregnant: false, daysSinceDelivery: 45, firstChild: false, secondChildGirl: true, isGovtEmployee: false, isDisadvantaged: true },
    expectedVerdict: "LIKELY_ELIGIBLE",
    expectedAmount: 6000
  },
  {
    desc: "TC-04: Central/State Govt Employee -> Strict NOT_ELIGIBLE exclusion",
    profile: { age: 28, isPregnant: true, firstChild: true, isGovtEmployee: true, isDisadvantaged: true },
    expectedVerdict: "NOT_ELIGIBLE",
    expectedAmount: 0
  },
  {
    desc: "TC-05: Statutory window expired (>270 days post-delivery) -> ASK_WORKER (No dead ends)",
    profile: { age: 23, isPregnant: false, daysSinceDelivery: 300, firstChild: true, isGovtEmployee: false, isDisadvantaged: true },
    expectedVerdict: "ASK_WORKER",
    expectedAmount: 0
  }
];

let failed = 0;
console.log("Running AI Evaluator Compliance Suite...\n");
for (const tc of evaluatorMatrix) {
  const res = evaluate(tc.profile);
  const pass = res.verdict === tc.expectedVerdict && (res.amount || 0) === tc.expectedAmount;
  if (!pass) {
    console.error(`FAIL: ${tc.desc} -> Got ${res.verdict} (₹${res.amount})`);
    failed++;
  } else {
    console.log(`PASS: ${tc.desc}`);
  }
}

if (failed > 0) process.exit(1);
console.log("\nAll Evaluator Matrix criteria passed.");