import type { Lang, Profile, SlotKey, UnderstandResponse } from "../types";
import { localParse } from "./localParse";

const INTENTS = [
  "pregnant_or_nursing",
  "girl_child_savings",
  "girl_education",
  "monthly_income_support",
  "shg_livelihood",
  "start_business",
  "cooking_fuel",
  "free_travel",
  "digital_access",
  "child_school_support",
];

const STATES = [
  "TN",
  "KA",
  "MH",
  "MP",
  "WB",
  "TS",
  "UP",
  "RJ",
  "AP",
  "AS",
  "OTHER",
];

const INTENT_SET = new Set(INTENTS);
const STATE_SET = new Set(STATES);

export function sanitizeSlots(raw: unknown): Partial<Profile> {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<Profile> = {};

  if (typeof r.intent === "string" && INTENT_SET.has(r.intent))
    out.intent = r.intent as Profile["intent"];
  if (typeof r.state === "string" && STATE_SET.has(r.state))
    out.state = r.state as Profile["state"];
  if (["pregnant", "newborn_mother", "neither"].includes(r.situation as string))
    out.situation = r.situation as Profile["situation"];
  if (
    typeof r.age === "number" &&
    Number.isInteger(r.age) &&
    r.age >= 10 &&
    r.age <= 60
  )
    out.age = r.age;
  if (
    typeof r.babyAgeMonths === "number" &&
    Number.isInteger(r.babyAgeMonths) &&
    r.babyAgeMonths >= 0 &&
    r.babyAgeMonths <= 36
  )
    out.babyAgeMonths = r.babyAgeMonths;
  if (["first", "second", "later"].includes(r.childOrder as string))
    out.childOrder = r.childOrder as Profile["childOrder"];
  if (typeof r.secondChildIsGirl === "boolean")
    out.secondChildIsGirl = r.secondChildIsGirl;
  if (typeof r.govtEmployee === "boolean") out.govtEmployee = r.govtEmployee;
  if (typeof r.hasQualifyingCard === "boolean")
    out.hasQualifyingCard = r.hasQualifyingCard;
  if (typeof r.hasBankOrPostAccount === "boolean")
    out.hasBankOrPostAccount = r.hasBankOrPostAccount;
  return out;
}

export async function understandSpeech(
  lang: Lang,
  expectedSlot: SlotKey | null,
  transcript: string
): Promise<UnderstandResponse> {
  const fallbackResult = (): UnderstandResponse => ({
    slots: localParse(expectedSlot, transcript, lang),
    source: "fallback",
  });

  if (!transcript || transcript.trim().length === 0 || transcript.length > 500) {
    return fallbackResult();
  }

  // 8-second timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/understand", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lang,
        expectedSlot,
        transcript,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallbackResult();
    }

    const data = await response.json();
    const cleanSlots = sanitizeSlots(data?.slots);

    // If live extraction returned empty or no relevant keys, fall back
    if (Object.keys(cleanSlots).length === 0) {
      return fallbackResult();
    }

    return {
      slots: cleanSlots,
      source: "live",
    };
  } catch {
    clearTimeout(timeoutId);
    return fallbackResult();
  }
}
