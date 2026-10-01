import type { DocKey, Lang, Verdict } from "../types";

const DOC_LABELS: Record<Lang, Record<DocKey, string>> = {
  hi: {
    aadhaar: "आधार कार्ड",
    bank_passbook: "बैंक / डाकघर पासबुक",
    mother_child_card: "मातृ एवं शिशु सुरक्षा कार्ड (MCP)",
    photo: "पासपोर्ट फोटो",
  },
  ta: {
    aadhaar: "ஆதார் கார்டு",
    bank_passbook: "வங்கி / அஞ்சலக பாஸ்புக்",
    mother_child_card: "தாய் சேய் நல அட்டை (MCP)",
    photo: "பாஸ்போர்ட் அளவு புகைப்படம்",
  },
  en: {
    aadhaar: "Aadhaar Card",
    bank_passbook: "Bank / Post Passbook",
    mother_child_card: "Mother & Child Card (MCP)",
    photo: "Passport Photos",
  },
};

export interface WhatsAppMessageParams {
  lang: Lang;
  schemeTitle: string;
  verdict?: Verdict;
  amount?: number;
  documents?: DocKey[];
}

/**
 * Builds a localized, privacy-safe WhatsApp message summarizing the Vaani result.
 * Strictly avoids any personal identifiable information (PII).
 */
export function buildWhatsAppMessage({
  lang,
  schemeTitle,
  verdict,
  amount,
  documents = ["aadhaar", "bank_passbook", "mother_child_card"],
}: WhatsAppMessageParams): string {
  const docTable = DOC_LABELS[lang] || DOC_LABELS.en;
  // Passport photo is not an official PMMVY portal document requirement (Aadhaar e-KYC is used)
  const pmmvyDocs = documents.filter((d) => d !== "photo");
  const docList = pmmvyDocs.map((d) => `- ${docTable[d] || d}`).join("\n");

  if (lang === "hi") {
    let msg = `वाणी — सरकारी योजना सहायता\n\n`;
    msg += `योजना: ${schemeTitle}\n`;
    if (verdict === "ASK_WORKER") {
      msg += `परिणाम: कृपया पात्रता की पुष्टि के लिए अपने नजदीकी आंगनवाड़ी केंद्र से संपर्क करें।\n`;
    } else {
      msg += `परिणाम: आप इस योजना के लिए पात्र हो सकती हैं।\n`;
    }
    if (amount) {
      msg += `संभावित सहायता राशि: ₹${amount.toLocaleString("en-IN")}\n`;
    }
    msg += `\nसाथ रखने वाले ज़रूरी दस्तावेज़:\n${docList}\n\n`;
    msg += `अगला कदम:\nआवेदन और सहायता के लिए कृपया अपने नजदीकी आंगनवाड़ी केंद्र या आशा कार्यकर्ता दीदी से संपर्क करें।`;
    return msg;
  }

  if (lang === "ta") {
    let msg = `வாணி — அரசு நலத்திட்ட வழிகாட்டி\n\n`;
    msg += `திட்டம்: ${schemeTitle}\n`;
    if (verdict === "ASK_WORKER") {
      msg += `தகுதி நிலை: தகுதியை உறுதி செய்ய உங்கள் அருகிலுள்ள அங்கன்வாடி மையத்தை அணுகவும்.\n`;
    } else {
      msg += `தகுதி நிலை: இத்திட்டத்திற்கு நீங்கள் தகுதி பெற வாய்ப்புள்ளது.\n`;
    }
    if (amount) {
      msg += `உத்தேச உதவித்தொகை: ₹${amount.toLocaleString("en-IN")}\n`;
    }
    msg += `\nதயாராக வைத்திருக்க வேண்டிய ஆவணங்கள்:\n${docList}\n\n`;
    msg += `அடுத்த கட்ட நடவடிக்கை:\nவிண்ணப்ப உதவிக்கு தயவுசெய்து உங்கள் அருகிலுள்ள அங்கன்வாடி மையம் அல்லது ஆஷா பணியாளரை அணுகவும்.`;
    return msg;
  }

  // Default English
  let msg = `Vaani — Government Scheme Help\n\n`;
  msg += `Scheme: ${schemeTitle}\n`;
  if (verdict === "ASK_WORKER") {
    msg += `Result: Please consult your Anganwadi worker to verify eligibility.\n`;
  } else {
    msg += `Result: You may qualify for this scheme.\n`;
  }
  if (amount) {
    msg += `Potential Benefit: ₹${amount.toLocaleString("en-IN")}\n`;
  }
  msg += `\nDocuments to keep ready:\n${docList}\n\n`;
  msg += `Next step:\nPlease contact your nearest Anganwadi Centre or ASHA worker for application assistance.`;
  return msg;
}

/**
 * Returns the click-to-chat WhatsApp URL with pre-filled message.
 */
export function getWhatsAppShareUrl(params: WhatsAppMessageParams): string {
  const text = buildWhatsAppMessage(params);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

