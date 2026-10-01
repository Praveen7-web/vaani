export type Lang = "hi" | "ta" | "en";

export type StateCode =
  | "TN"
  | "KA"
  | "MH"
  | "MP"
  | "WB"
  | "TS"
  | "UP"
  | "RJ"
  | "AP"
  | "AS";

export type Intent =
  | "pregnant_or_nursing"
  | "girl_child_savings"
  | "girl_education"
  | "monthly_income_support"
  | "shg_livelihood"
  | "start_business"
  | "cooking_fuel"
  | "free_travel"
  | "digital_access"
  | "child_school_support";

export type Situation = "pregnant" | "newborn_mother" | "neither";
export type ChildOrder = "first" | "second" | "later";

export interface Profile {
  // routing slots
  intent?: Intent;
  state?: StateCode | "OTHER";

  // PMMVY deep-flow slots
  situation?: Situation;
  age?: number; // years
  babyAgeMonths?: number; // only asked if situation === 'newborn_mother'
  childOrder?: ChildOrder;
  secondChildIsGirl?: boolean; // only asked if childOrder === 'second'
  govtEmployee?: boolean;
  hasQualifyingCard?: boolean; // e-Shram / Ayushman / BPL / job card etc.
  hasBankOrPostAccount?: boolean;
}

export type SlotKey = keyof Profile;

export type Verdict =
  | "LIKELY_ELIGIBLE" // rules say yes; worker confirms
  | "ASK_WORKER" // cannot decide safely (unverified rule, edge case)
  | "NOT_ELIGIBLE"
  | "NEEDS_INFO";

export type ReasonKey =
  | "likely_eligible"
  | "not_pregnant_or_nursing"
  | "under_min_age"
  | "window_closed"
  | "govt_employee"
  | "later_child"
  | "second_child_not_girl"
  | "no_qualifying_card"
  | "need_more_info";

export type DocKey =
  | "aadhaar"
  | "bank_passbook"
  | "mother_child_card"
  | "photo";

export interface EligibilityResult {
  verdict: Verdict;
  reason: ReasonKey;
  amountInr?: number;
  amount?: number; // Evaluator matrix compatibility alias
  nextSlot?: SlotKey; // set when verdict === 'NEEDS_INFO'
  documents: DocKey[]; // for the Handoff Card
  needsAccountHelp: boolean; // true if she has no bank/post account
}

export type VerifyStatus = "unverified" | "partially_verified" | "verified";

export interface Scheme {
  id: string;
  name: string;
  department?: string;
  intents: Intent[];
  benefit: string;
  deepFlow: boolean;
  verification: {
    status: VerifyStatus;
    lastVerified: string | null;
    sourceUrl: string | null;
    note?: string;
  };
}

export interface UnderstandRequest {
  lang: Lang;
  expectedSlot: SlotKey | null; // the question that was just asked
  transcript: string; // max 500 chars
}

export interface UnderstandResponse {
  slots: Partial<Profile>;
  source: "live" | "fallback";
}
