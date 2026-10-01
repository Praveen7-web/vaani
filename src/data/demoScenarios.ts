import type { Lang, Profile } from "../types";

export interface DemoStep {
  slot: keyof Profile;
  utterance: string;
  expectedValue: any;
  displayValue: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  lang: Lang;
  steps: DemoStep[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "eligible_first_child",
    title: "1. Eligible 1st-Time Mother (PMMVY ₹5,000)",
    subtitle: "22 y/o pregnant, rural UP, qualifies for full ₹5,000 maternity cash",
    lang: "hi",
    steps: [
      {
        slot: "intent",
        utterance: "मुझे गर्भावस्था में सरकारी सहायता चाहिए",
        expectedValue: "pregnant_or_nursing",
        displayValue: "गर्भावस्था सहायता",
      },
      {
        slot: "state",
        utterance: "उत्तर प्रदेश",
        expectedValue: "UP",
        displayValue: "उत्तर प्रदेश",
      },
      {
        slot: "situation",
        utterance: "मैं अभी गर्भवती हूँ",
        expectedValue: "pregnant",
        displayValue: "गर्भवती हूँ",
      },
      {
        slot: "age",
        utterance: "मेरी उम्र 22 साल है",
        expectedValue: 22,
        displayValue: "22 वर्ष",
      },
      {
        slot: "childOrder",
        utterance: "यह मेरा पहला बच्चा है",
        expectedValue: "first",
        displayValue: "पहला बच्चा",
      },
      {
        slot: "govtEmployee",
        utterance: "नहीं, हम सरकारी नौकरी में नहीं हैं",
        expectedValue: false,
        displayValue: "नहीं (सरकारी नौकरी नहीं)",
      },
      {
        slot: "hasQualifyingCard",
        utterance: "हाँ, मेरे पास राशन कार्ड और ई-श्रम कार्ड है",
        expectedValue: true,
        displayValue: "हाँ (ई-श्रम / राशन कार्ड)",
      },
      {
        slot: "hasBankOrPostAccount",
        utterance: "हाँ, मेरा बैंक खाता है",
        expectedValue: true,
        displayValue: "हाँ (बैंक खाता उपलब्ध)",
      },
    ],
  },
  {
    id: "not_eligible_third_child",
    title: "2. Later Child → Kind Human Handoff",
    subtitle: "3rd pregnancy, kindly routed to Anganwadi worker without a dead end",
    lang: "hi",
    steps: [
      {
        slot: "intent",
        utterance: "गर्भवती महिला सहायता",
        expectedValue: "pregnant_or_nursing",
        displayValue: "गर्भावस्था सहायता",
      },
      {
        slot: "state",
        utterance: "मध्य प्रदेश",
        expectedValue: "MP",
        displayValue: "मध्य प्रदेश",
      },
      {
        slot: "situation",
        utterance: "गर्भवती हूँ",
        expectedValue: "pregnant",
        displayValue: "गर्भवती हूँ",
      },
      {
        slot: "age",
        utterance: "28 साल",
        expectedValue: 28,
        displayValue: "28 वर्ष",
      },
      {
        slot: "childOrder",
        utterance: "यह मेरा तीसरा बच्चा है",
        expectedValue: "later",
        displayValue: "तीसरा बच्चा",
      },
    ],
  },
  {
    id: "telangana_pregnant_companion",
    title: "3. Telangana + Pregnant (PMMVY + Arogya Lakshmi)",
    subtitle: "Central cash benefit + Telangana state nutritious meal companion",
    lang: "ta",
    steps: [
      {
        slot: "intent",
        utterance: "கர்ப்பிணி உதவித்தொகை",
        expectedValue: "pregnant_or_nursing",
        displayValue: "கர்ப்பிணி உதவி",
      },
      {
        slot: "state",
        utterance: "தெலுங்கானா",
        expectedValue: "TS",
        displayValue: "தெலங்கானா (Telangana)",
      },
      {
        slot: "situation",
        utterance: "கர்ப்பமாக இருக்கிறேன்",
        expectedValue: "pregnant",
        displayValue: "கர்ப்பமாக இருக்கிறேன்",
      },
      {
        slot: "age",
        utterance: "வயது 24",
        expectedValue: 24,
        displayValue: "24 வயது",
      },
      {
        slot: "childOrder",
        utterance: "முதல் குழந்தை",
        expectedValue: "first",
        displayValue: "முதல் குழந்தை",
      },
      {
        slot: "govtEmployee",
        utterance: "அரசு வேலை இல்லை",
        expectedValue: false,
        displayValue: "இல்லை",
      },
      {
        slot: "hasQualifyingCard",
        utterance: "ரேஷன் கார்டு உள்ளது",
        expectedValue: true,
        displayValue: "ஆம்",
      },
      {
        slot: "hasBankOrPostAccount",
        utterance: "வங்கி பாஸ்புக் உள்ளது",
        expectedValue: true,
        displayValue: "ஆம்",
      },
    ],
  },
];
