import React from "react";
import { BigButton, Card, Badge } from "./ui";
import { t } from "../services/i18n";
import type { DocKey, EligibilityResult, Lang, Scheme } from "../types";
import {
  MapPin,
  PhoneCall,
  Share2,
  AlertCircle,
  FileText,
  RotateCcw,
} from "lucide-react";

interface HandoffCardProps {
  lang: Lang;
  schemeTitle: string;
  eligibilityResult?: EligibilityResult;
  discoveryScheme?: Scheme;
  onRestart: () => void;
}

export const HandoffCard: React.FC<HandoffCardProps> = ({
  lang,
  schemeTitle,
  eligibilityResult,
  discoveryScheme,
  onRestart,
}) => {
  const isLikelyEligible = eligibilityResult?.verdict === "LIKELY_ELIGIBLE";
  const amount = eligibilityResult?.amountInr;
  const docs: DocKey[] = eligibilityResult?.documents || [
    "aadhaar",
    "bank_passbook",
    "mother_child_card",
    "photo",
  ];
  const needsAccountHelp = eligibilityResult?.needsAccountHelp ?? false;

  // Build WhatsApp share message
  const buildShareText = (): string => {
    let msg = "";
    if (lang === "hi") {
      msg = `नमस्ते। मुझे वाणी ऐप से सरकारी योजना की जानकारी मिली है:\nयोजना: ${schemeTitle}\n`;
      if (amount) msg += `संभावित लाभ: ₹${amount}\n`;
      msg += `आवश्यक दस्तावेज़: आधार कार्ड, बैंक पासबुक, मातृ-शिशु कार्ड (MCP), फोटो।\nकृपया मुझे आंगनवाड़ी में आवेदन करने में मदद करें।`;
    } else if (lang === "ta") {
      msg = `வணக்கம். வாணி செயலி மூலம் எனக்கு இந்த அரசு நலத்திட்டம் தெரியவந்துள்ளது:\nதிட்டம்: ${schemeTitle}\n`;
      if (amount) msg += `உத்தேச உதவித்தொகை: ₹${amount}\n`;
      msg += `தேவையான ஆவணங்கள்: ஆதார் அட்டை, வங்கி பாஸ்புக், தாய் சேய் அட்டை, புகைப்படம்.\nதயவுசெய்து அங்கன்வாடியில் விண்ணப்பிக்க எனக்கு உதவவும்.`;
    } else {
      msg = `Hello. I checked my welfare benefits on Vaani:\nScheme: ${schemeTitle}\n`;
      if (amount) msg += `Potential Benefit: ₹${amount}\n`;
      msg += `Required Documents: Aadhaar Card, Bank Passbook, MCP Card, Photo.\nPlease help me apply at the nearest Anganwadi centre.`;
    }
    return encodeURIComponent(msg);
  };

  const docIcons: Record<DocKey, string> = {
    aadhaar: "🪪",
    bank_passbook: "🏦",
    mother_child_card: "📜",
    photo: "📷",
  };

  return (
    <div className="w-full flex flex-col gap-4 items-center">
      {/* Top Banner Card */}
      <Card className="w-full text-center border-3">
        <div className="flex justify-center mb-2">
          <Badge
            variant={isLikelyEligible ? "green" : "yellow"}
            icon={<FileText className="w-4 h-4" />}
            label="Last-Mile Handoff Card"
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-black mb-1 leading-snug">
          {schemeTitle}
        </h1>

        {isLikelyEligible && amount ? (
          <div className="my-3 py-2 bg-green-50 rounded-2xl border-2 border-black inline-block px-5">
            <span className="text-3xl sm:text-4xl font-black text-green-700 block">
              ₹{amount.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-extrabold text-gray-700">
              {lang === "hi"
                ? "आपको मिलने की संभावना है"
                : lang === "ta"
                ? "உங்களுக்கு கிடைக்க வாய்ப்புள்ளது"
                : "You may likely qualify"}
            </span>
          </div>
        ) : (
          <p className="text-base font-bold text-gray-800 my-2">
            {discoveryScheme?.benefit ||
              (lang === "hi"
                ? "अपनी पात्रता की पुष्टि के लिए अपनी आंगनवाड़ी दीदी से मिलें।"
                : lang === "ta"
                ? "உங்கள் தகுதியை உறுதிப்படுத்த அங்கன்வாடி பணியாளரை அணுகவும்."
                : "Please consult your Anganwadi worker to confirm eligibility.")}
          </p>
        )}

        {/* Bank account notice if needed */}
        {needsAccountHelp && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-2.5 mt-2 text-left flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-bold text-red-800 leading-tight">
              {t(lang, "needs_account_warning")}
            </p>
          </div>
        )}
      </Card>

      {/* Visual Document Checklist */}
      <Card className="w-full p-4">
        <h2 className="text-base font-extrabold mb-3 flex items-center gap-1.5">
          <span>📋</span>
          <span>
            {lang === "hi"
              ? "साथ ले जाने वाले ज़रूरी दस्तावेज़:"
              : lang === "ta"
              ? "கொண்டு செல்ல வேண்டிய ஆவணங்கள்:"
              : "Documents to Carry:"}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {docs.map((d) => (
            <div
              key={d}
              className="bg-yellow-50 border-2 border-black rounded-xl p-2.5 flex items-center gap-2 shadow-brutal-sm"
            >
              <span className="text-2xl" aria-hidden="true">
                {docIcons[d]}
              </span>
              <span className="text-xs sm:text-sm font-bold leading-tight">
                {t(lang, `doc_${d}`)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons: Maps, 181, WhatsApp */}
      <div className="w-full flex flex-col gap-2.5">
        {/* 1. Maps Anganwadi Finder */}
        <a
          href="https://www.google.com/maps/search/?api=1&query=anganwadi+centre+near+me"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <BigButton
            variant="yellow"
            className="w-full text-base sm:text-lg min-h-[58px]"
            icon={<MapPin className="w-6 h-6 text-black flex-shrink-0" />}
          >
            {t(lang, "go_to_anganwadi")}
          </BigButton>
        </a>

        {/* 2. Call 181 Helpline */}
        <a href="tel:181" className="w-full">
          <BigButton
            variant="white"
            className="w-full text-base sm:text-lg min-h-[58px]"
            icon={<PhoneCall className="w-6 h-6 text-green-700 flex-shrink-0" />}
          >
            {t(lang, "call_181")}
          </BigButton>
        </a>

        {/* 3. WhatsApp Share */}
        <a
          href={`https://wa.me/?text=${buildShareText()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <BigButton
            variant="green"
            className="w-full text-base sm:text-lg min-h-[58px]"
            icon={<Share2 className="w-6 h-6 text-white flex-shrink-0" />}
          >
            {t(lang, "share_with_worker")}
          </BigButton>
        </a>
      </div>

      {/* Start Over Button */}
      <button
        type="button"
        onClick={onRestart}
        className="mt-2 py-2 px-4 text-sm font-bold text-gray-700 underline flex items-center gap-1.5 hover:text-black cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        <span>{t(lang, "start_again")}</span>
      </button>
    </div>
  );
};
