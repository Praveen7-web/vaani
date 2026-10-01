import type { Lang, Profile } from "../types";

export interface DemoStep {
  slot: keyof Profile;
  value: any;
  utterances: Record<Lang, string>;
  utterance: string; // Default utterance (fallback)
  expectedValue: any;
  displayValue: string;
}

export interface DemoScenario {
  id: string;
  titles: Record<Lang, string>;
  subtitles: Record<Lang, string>;
  title: string; // Default title
  subtitle: string; // Default subtitle
  steps: DemoStep[];
}

export function getScenarioTitle(scenario: DemoScenario, lang: Lang): string {
  return scenario.titles[lang] || scenario.titles.en || scenario.title;
}

export function getScenarioSubtitle(scenario: DemoScenario, lang: Lang): string {
  return scenario.subtitles[lang] || scenario.subtitles.en || scenario.subtitle;
}

export function getStepUtterance(step: DemoStep, lang: Lang): string {
  return step.utterances[lang] || step.utterances.en || step.utterance;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "eligible_first_child",
    title: "1. Eligible 1st-Time Mother (PMMVY ₹5,000)",
    subtitle: "22 y/o pregnant, rural UP, qualifies for full ₹5,000 maternity cash",
    titles: {
      hi: "1. पात्र प्रथम गर्भवती महिला (PMMVY ₹5,000)",
      ta: "1. தகுதியான முதல் தாய் (PMMVY ₹5,000)",
      en: "1. Eligible 1st-Time Mother (PMMVY ₹5,000)",
    },
    subtitles: {
      hi: "22 वर्ष गर्भवती, उत्तर प्रदेश, ₹5,000 मातृत्व नकद सहायता",
      ta: "22 வயது கர்ப்பிணி, உத்தர பிரதேசம், ₹5,000 மகப்பேறு உதவி",
      en: "22 y/o pregnant, rural UP, qualifies for full ₹5,000 maternity cash",
    },
    steps: [
      {
        slot: "intent",
        value: "pregnant_or_nursing",
        expectedValue: "pregnant_or_nursing",
        displayValue: "pregnant_or_nursing",
        utterance: "I need maternity and pregnancy support",
        utterances: {
          hi: "मुझे गर्भावस्था सहायता चाहिए",
          ta: "எனக்கு கர்ப்பிணி உதவித்தொகை வேண்டும்",
          en: "I need pregnancy and maternity assistance",
        },
      },
      {
        slot: "state",
        value: "UP",
        expectedValue: "UP",
        displayValue: "UP",
        utterance: "Uttar Pradesh",
        utterances: {
          hi: "उत्तर प्रदेश",
          ta: "உத்தரப் பிரதேசம்",
          en: "Uttar Pradesh",
        },
      },
      {
        slot: "situation",
        value: "pregnant",
        expectedValue: "pregnant",
        displayValue: "pregnant",
        utterance: "I am pregnant",
        utterances: {
          hi: "मैं अभी गर्भवती हूँ",
          ta: "நான் இப்போது கர்ப்பமாக இருக்கிறேன்",
          en: "I am currently pregnant",
        },
      },
      {
        slot: "age",
        value: 22,
        expectedValue: 22,
        displayValue: "22",
        utterance: "22 years old",
        utterances: {
          hi: "मेरी उम्र 22 साल है",
          ta: "எனக்கு வயது 22",
          en: "I am 22 years old",
        },
      },
      {
        slot: "childOrder",
        value: "first",
        expectedValue: "first",
        displayValue: "first",
        utterance: "first child",
        utterances: {
          hi: "यह मेरा पहला बच्चा है",
          ta: "இது எனது முதல் குழந்தை",
          en: "This is my first child",
        },
      },
      {
        slot: "govtEmployee",
        value: false,
        expectedValue: false,
        displayValue: "false",
        utterance: "no government job",
        utterances: {
          hi: "नहीं, हम सरकारी नौकरी में नहीं हैं",
          ta: "இல்லை அரசு வேலை இல்லை",
          en: "No government job",
        },
      },
      {
        slot: "hasQualifyingCard",
        value: true,
        expectedValue: true,
        displayValue: "true",
        utterance: "yes I have ration card and e-Shram",
        utterances: {
          hi: "हाँ मेरे पास ई-श्रम और राशन कार्ड है",
          ta: "ஆம் என்னிடம் ரேஷன் கார்டு உள்ளது",
          en: "Yes, I have ration card and e-Shram",
        },
      },
      {
        slot: "hasBankOrPostAccount",
        value: true,
        expectedValue: true,
        displayValue: "true",
        utterance: "yes I have a bank account",
        utterances: {
          hi: "हाँ मेरा बैंक खाता है",
          ta: "ஆம் என்னிடம் வங்கி கணக்கு உள்ளது",
          en: "Yes, I have a bank account",
        },
      },
    ],
  },
  {
    id: "not_eligible_third_child",
    title: "2. Later Child → Kind Human Handoff",
    subtitle: "3rd pregnancy, kindly routed to Anganwadi worker without a dead end",
    titles: {
      hi: "2. तीसरा बच्चा → सम्मानजनक मानवीय सहायता",
      ta: "2. மூன்றாவது குழந்தை → அங்கன்வாடி உதவி",
      en: "2. Later Child → Kind Human Referral",
    },
    subtitles: {
      hi: "तीसरी गर्भावस्था, आंगनवाड़ी कार्यकर्ता से परामर्श का सुझाव",
      ta: "மூன்றாவது கர்ப்பம், அங்கன்வாடி பணியாளர் உதவிக்கு பரிந்துரை",
      en: "3rd pregnancy, kindly routed to Anganwadi worker",
    },
    steps: [
      {
        slot: "intent",
        value: "pregnant_or_nursing",
        expectedValue: "pregnant_or_nursing",
        displayValue: "pregnant_or_nursing",
        utterance: "pregnant mother support",
        utterances: {
          hi: "गर्भवती महिला सहायता",
          ta: "கர்ப்பிணி உதவி",
          en: "Pregnant mother support",
        },
      },
      {
        slot: "state",
        value: "MP",
        expectedValue: "MP",
        displayValue: "MP",
        utterance: "Madhya Pradesh",
        utterances: {
          hi: "मध्य प्रदेश",
          ta: "மத்திய பிரதேசம்",
          en: "Madhya Pradesh",
        },
      },
      {
        slot: "situation",
        value: "pregnant",
        expectedValue: "pregnant",
        displayValue: "pregnant",
        utterance: "pregnant",
        utterances: {
          hi: "गर्भवती हूँ",
          ta: "கர்ப்பமாக இருக்கிறேன்",
          en: "Currently pregnant",
        },
      },
      {
        slot: "age",
        value: 28,
        expectedValue: 28,
        displayValue: "28",
        utterance: "28 years",
        utterances: {
          hi: "28 साल",
          ta: "28 வயது",
          en: "28 years old",
        },
      },
      {
        slot: "childOrder",
        value: "later",
        expectedValue: "later",
        displayValue: "later",
        utterance: "third child",
        utterances: {
          hi: "यह मेरा तीसरा बच्चा है",
          ta: "இது எனது மூன்றாவது குழந்தை",
          en: "This is my third child",
        },
      },
    ],
  },
  {
    id: "telangana_pregnant_companion",
    title: "3. Telangana + Pregnant (PMMVY + Arogya Lakshmi)",
    subtitle: "Central cash benefit + Telangana state nutritious meal companion",
    titles: {
      hi: "3. तेलंगाना + गर्भवती (PMMVY + आरोग्य लक्ष्मी)",
      ta: "3. தெலுங்கானா + கர்ப்பிணி (PMMVY + ஆரோக்கிய லட்சுமி)",
      en: "3. Telangana + Pregnant (PMMVY + Arogya Lakshmi)",
    },
    subtitles: {
      hi: "केंद्रीय नकद लाभ + तेलंगाना राज्य पौष्टिक भोजन साथी योजना",
      ta: "மத்திய நிதி உதவி + தெலங்கானா மாநில சத்துணவு திட்டம்",
      en: "Central cash benefit + Telangana state nutritious meal companion",
    },
    steps: [
      {
        slot: "intent",
        value: "pregnant_or_nursing",
        expectedValue: "pregnant_or_nursing",
        displayValue: "pregnant_or_nursing",
        utterance: "pregnancy assistance",
        utterances: {
          hi: "गर्भावस्था सहायता चाहिए",
          ta: "கர்ப்பிணி உதவித்தொகை வேண்டும்",
          en: "Maternity benefit",
        },
      },
      {
        slot: "state",
        value: "TS",
        expectedValue: "TS",
        displayValue: "TS",
        utterance: "Telangana",
        utterances: {
          hi: "तेलंगाना",
          ta: "தெலுங்கானா",
          en: "Telangana",
        },
      },
      {
        slot: "situation",
        value: "pregnant",
        expectedValue: "pregnant",
        displayValue: "pregnant",
        utterance: "pregnant",
        utterances: {
          hi: "गर्भवती हूँ",
          ta: "கர்ப்பமாக இருக்கிறேன்",
          en: "Currently pregnant",
        },
      },
      {
        slot: "age",
        value: 24,
        expectedValue: 24,
        displayValue: "24",
        utterance: "24 years",
        utterances: {
          hi: "24 साल",
          ta: "24 வயது",
          en: "24 years old",
        },
      },
      {
        slot: "childOrder",
        value: "first",
        expectedValue: "first",
        displayValue: "first",
        utterance: "first child",
        utterances: {
          hi: "पहला बच्चा है",
          ta: "முதல் குழந்தை",
          en: "First child",
        },
      },
      {
        slot: "govtEmployee",
        value: false,
        expectedValue: false,
        displayValue: "false",
        utterance: "no government job",
        utterances: {
          hi: "नहीं, सरकारी नौकरी नहीं है",
          ta: "அரசு வேலை இல்லை",
          en: "No government job",
        },
      },
      {
        slot: "hasQualifyingCard",
        value: true,
        expectedValue: true,
        displayValue: "true",
        utterance: "yes ration card",
        utterances: {
          hi: "हाँ, राशन कार्ड है",
          ta: "ரேஷன் கார்டு உள்ளது",
          en: "Yes, I have ration card",
        },
      },
      {
        slot: "hasBankOrPostAccount",
        value: true,
        expectedValue: true,
        displayValue: "true",
        utterance: "yes bank account",
        utterances: {
          hi: "हाँ, बैंक खाता है",
          ta: "வங்கி பாஸ்புக் உள்ளது",
          en: "Yes, I have bank passbook",
        },
      },
    ],
  },
];
