import type { Lang, Profile, SlotKey } from "../types";

const YES_WORDS = new Set([
  // English
  "yes", "yeah", "yep", "true", "correct", "sure", "ok", "okay", "have", "i have",
  // Hindi
  "हाँ", "हा", "हाँजी", "जी हाँ", "सही", "हाँ है", "haan", "ha", "ji haan", "उपलब्ध", "है",
  // Tamil
  "ஆம்", "ஆமாம்", "ஆமா", "சரி", "உண்டு", "உள்ளது", "இருக்கிறது", "aam", "aamaam", "aama", "ullathu"
]);

const NO_WORDS = new Set([
  // English
  "no", "nope", "not", "false", "neither", "don't have", "no account", "no job", "none",
  // Hindi
  "नहीं", "ना", "गलत", "नहीं है", "nahi", "na", "nahin", "nahi hai",
  // Tamil
  "இல்லை", "இல்ல", "கிடையாது", "தவறு", "இல்லீங்க", "illai", "illa", "kidaiyathu"
]);

const HINDI_NUMBERS: Record<string, number> = {
  "शून्य": 0, "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
  "ग्यारह": 11, "बारह": 12, "तेरह": 13, "चौदह": 14, "पंद्रह": 15, "सोलह": 16, "सत्रह": 17, "अठारह": 18, "उन्नीस": 19, "बीस": 20,
  "इक्कीस": 21, "बाईस": 22, "तेईस": 23, "चौबीस": 24, "पच्चीस": 25, "छब्बीस": 26, "सत्ताईस": 27, "अट्ठाईस": 28, "उनतीस": 29, "तीस": 30,
  "इकतीस": 31, "बत्तीस": 32, "तैंतीस": 33, "चौंतीस": 34, "पैंतीस": 35, "छत्तीस": 36, "सैंतीस": 37, "अड़तीस": 38, "उनतालीस": 39, "चालीस": 40
};

const TAMIL_NUMBERS: Record<string, number> = {
  "பூஜ்ஜியம்": 0, "ஒன்று": 1, "ஒன்னு": 1, "இரண்டு": 2, "ரெண்டு": 2, "மூன்று": 3, "மூணு": 3, "நான்கு": 4, "நாலு": 4, "ஐந்து": 5, "அஞ்சு": 5,
  "ஆறு": 6, "ஏழு": 7, "எட்டு": 8, "ஒன்பது": 9, "பத்து": 10, "பதினொன்று": 11, "பன்னிரண்டு": 12, "பதின்மூன்று": 13, "பதினான்கு": 14,
  "பதினைந்து": 15, "பதினாறு": 16, "பதினேழு": 17, "பதினெட்டு": 18, "பத்தொன்பது": 19, "இருபது": 20, "இருபத்தி ஒன்று": 21, "இருபத்தி இரண்டு": 22,
  "இருபத்தி மூன்று": 23, "இருபத்தி நான்கு": 24, "இருபத்தி ஐந்து": 25, "இருபத்தி ஆறு": 26, "இருபத்தி ஏழு": 27, "இருபத்தி எட்டு": 28,
  "இருபத்தி ஒன்பது": 29, "முப்பது": 30
};

function extractNumber(text: string): number | null {
  // Check direct digits
  const digitMatch = text.match(/\b\d+\b/);
  if (digitMatch) {
    const val = parseInt(digitMatch[0], 10);
    if (!isNaN(val)) return val;
  }

  // Check Hindi number words
  for (const [word, num] of Object.entries(HINDI_NUMBERS)) {
    if (text.includes(word)) return num;
  }

  // Check Tamil number words
  for (const [word, num] of Object.entries(TAMIL_NUMBERS)) {
    if (text.includes(word)) return num;
  }

  return null;
}

export function localParse(
  expectedSlot: SlotKey | null,
  transcript: string,
  _lang: Lang
): Partial<Profile> {
  const t = transcript.trim().toLowerCase();
  const out: Partial<Profile> = {};

  if (!t) return out;

  // Boolean helper - negation takes precedence
  const isNo = [...NO_WORDS].some((w) => t.includes(w.toLowerCase()));
  const isYes = !isNo && [...YES_WORDS].some((w) => t.includes(w.toLowerCase()));

  switch (expectedSlot) {
    case "situation": {
      if (
        t.includes("गर्भवती") || t.includes("pregnant") || t.includes("கர்ப்ப") ||
        t.includes("கர்ப்பமாக") || t.includes("கர்ப்பிணி") || t.includes("கருவுற்ற") ||
        t.includes("पेट से") || t.includes("expecting")
      ) {
        out.situation = "pregnant";
      } else if (
        t.includes("नवजात") || t.includes("newborn") || t.includes("baby") ||
        t.includes("बच्चा हुआ") || t.includes("பச்சிளங்குழந்தை") || t.includes("குழந்தை பிறந்தது") ||
        t.includes("குழந்தை உள்ளது") || t.includes("குழந்தை பெற்ற")
      ) {
        out.situation = "newborn_mother";
      } else if (isNo || t.includes("neither") || t.includes("दोनों नहीं") || t.includes("இல்லை")) {
        out.situation = "neither";
      }
      break;
    }

    case "age": {
      const num = extractNumber(t);
      if (num !== null && num >= 10 && num <= 60) {
        out.age = num;
      }
      break;
    }

    case "babyAgeMonths": {
      const num = extractNumber(t);
      if (num !== null && num >= 0 && num <= 36) {
        out.babyAgeMonths = num;
      }
      break;
    }

    case "childOrder": {
      if (
        t.includes("first") || t.includes("1st") || t.includes("पहला") ||
        t.includes("முதல்") || t.includes("முதலாவது") || t === "1"
      ) {
        out.childOrder = "first";
      } else if (
        t.includes("second") || t.includes("2nd") || t.includes("दूसरा") ||
        t.includes("இரண்டாவது") || t.includes("இரண்டாம்") || t === "2"
      ) {
        out.childOrder = "second";
      } else if (
        t.includes("third") || t.includes("later") || t.includes("तीसरा") ||
        t.includes("மூன்றாவது") || t.includes("மூன்றாம்") || t.includes("3rd") || t === "3"
      ) {
        out.childOrder = "later";
      }
      break;
    }

    case "secondChildIsGirl": {
      if (t.includes("girl") || t.includes("लड़की") || t.includes("बेटी") || t.includes("பெண்") || (isYes && !isNo)) {
        out.secondChildIsGirl = true;
      } else if (t.includes("boy") || t.includes("लड़का") || t.includes("बेटा") || t.includes("ஆண்") || (isNo && !isYes)) {
        out.secondChildIsGirl = false;
      }
      break;
    }

    case "govtEmployee": {
      // Government employment check
      const hasGovtMention = t.includes("govt") || t.includes("सरकारी") || t.includes("அரசு");
      if (hasGovtMention && isNo) {
        out.govtEmployee = false;
      } else if (hasGovtMention && (isYes || t.includes("नौकरी है") || t.includes("வேலை உண்டு"))) {
        out.govtEmployee = true;
      } else if (isYes && !isNo) {
        out.govtEmployee = true;
      } else if (isNo && !isYes) {
        out.govtEmployee = false;
      }
      break;
    }

    case "hasQualifyingCard": {
      const hasCardMention = t.includes("card") || t.includes("कार्ड") || t.includes("கார்டு") ||
        t.includes("shram") || t.includes("श्रम") || t.includes("ration") || t.includes("ரேஷன்") ||
        t.includes("ayushman") || t.includes("ஆயுஷ்மான்") || t.includes("mgnrega") || t.includes("நரேகா");
      if (hasCardMention && !isNo) {
        out.hasQualifyingCard = true;
      } else if (isYes && !isNo) {
        out.hasQualifyingCard = true;
      } else if (isNo && !isYes) {
        out.hasQualifyingCard = false;
      }
      break;
    }

    case "hasBankOrPostAccount": {
      const hasAccountMention = t.includes("bank") || t.includes("बैंक") || t.includes("வங்கி") ||
        t.includes("khata") || t.includes("खाता") || t.includes("கணக்கு") || t.includes("பாஸ்புக்") ||
        t.includes("passbook") || t.includes("post") || t.includes("डाकघर");
      if (hasAccountMention && !isNo) {
        out.hasBankOrPostAccount = true;
      } else if (isYes && !isNo) {
        out.hasBankOrPostAccount = true;
      } else if (isNo && !isYes) {
        out.hasBankOrPostAccount = false;
      }
      break;
    }

    case "state": {
      if (t.includes("tamil") || t.includes("तमिलनाडु") || t.includes("தமிழ்நாடு") || t.includes("தமிழ்") || t.includes("tn")) out.state = "TN";
      else if (t.includes("telangana") || t.includes("तेलंगाना") || t.includes("தெலுங்கானா") || t.includes("தெலங்கானா") || t.includes("తెలంగాణ") || t.includes("ts")) out.state = "TS";
      else if (t.includes("karnataka") || t.includes("कर्नाटक") || t.includes("கர்நாடகா") || t.includes("ಕರ್ನಾಟಕ") || t.includes("ka")) out.state = "KA";
      else if (t.includes("maharashtra") || t.includes("महाराष्ट्र") || t.includes("மகாராஷ்டிரா") || t.includes("mh")) out.state = "MH";
      else if (t.includes("madhya") || t.includes("मध्य") || t.includes("மத்திய") || t.includes("mp")) out.state = "MP";
      else if (t.includes("bengal") || t.includes("पश्चिम") || t.includes("बंगाल") || t.includes("வங்கம்") || t.includes("wb")) out.state = "WB";
      else if (t.includes("uttar") || t.includes("उत्तर") || t.includes("உத்தர") || t.includes("up")) out.state = "UP";
      else if (t.includes("rajasthan") || t.includes("राजस्थान") || t.includes("ராஜஸ்தான்") || t.includes("rj")) out.state = "RJ";
      else if (t.includes("andhra") || t.includes("आंध्र") || t.includes("ஆந்திரா") || t.includes("ఆంధ్ర") || t.includes("ap")) out.state = "AP";
      else if (t.includes("assam") || t.includes("असम") || t.includes("அஸ்ஸாம்") || t.includes("as")) out.state = "AS";
      else if (t.includes("other") || t.includes("अन्य") || t.includes("மற்ற") || t.includes("வேற")) out.state = "OTHER";
      break;
    }

    case "intent": {
      if (
        t.includes("pregnant") || t.includes("pregnancy") || t.includes("गर्भ") ||
        t.includes("maternity") || t.includes("मातृत्व") || t.includes("बच्चा") ||
        t.includes("கர்ப்ப") || t.includes("மகப்பேறு") || t.includes("மாதா")
      ) {
        out.intent = "pregnant_or_nursing";
      } else if (
        t.includes("savings") || t.includes("sukanya") || t.includes("सुकन्या") ||
        t.includes("செல்வமகள்") || t.includes("சேமிப்பு") || t.includes("girl child")
      ) {
        out.intent = "girl_child_savings";
      } else if (
        t.includes("education") || t.includes("पढ़ाई") || t.includes("படிப்பு") ||
        t.includes("கல்வி") || t.includes("school") || t.includes("penn")
      ) {
        out.intent = "girl_education";
      } else if (
        t.includes("monthly") || t.includes("पैसे") || t.includes("உரிமைத்தொகை") ||
        t.includes("உதவித்தொகை") || t.includes("income") || t.includes("सहायता राशि")
      ) {
        out.intent = "monthly_income_support";
      } else if (
        t.includes("gas") || t.includes("गैस") || t.includes("சிலிண்டர்") ||
        t.includes("காஸ்") || t.includes("ujjwala") || t.includes("उज्ज्वला")
      ) {
        out.intent = "cooking_fuel";
      } else if (
        t.includes("bus") || t.includes("बस") || t.includes("பேருந்து") ||
        t.includes("பயணம்") || t.includes("travel")
      ) {
        out.intent = "free_travel";
      } else if (
        t.includes("business") || t.includes("व्यापार") || t.includes("தொழில்") ||
        t.includes("dukaan") || t.includes("दुकान") || t.includes("வியாபாரம்")
      ) {
        out.intent = "start_business";
      } else if (
        t.includes("shg") || t.includes("samuh") || t.includes("समूह") ||
        t.includes("குழு") || t.includes("சுயஉதவி")
      ) {
        out.intent = "shg_livelihood";
      }
      break;
    }
  }

  return out;
}
