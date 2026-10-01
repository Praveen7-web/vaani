import React, { useState } from "react";
import { BigButton, Card, Badge } from "./ui";
import { t } from "../services/i18n";
import type { DocKey, EligibilityResult, Lang, Scheme } from "../types";
import { getWhatsAppShareUrl, buildWhatsAppMessage } from "../services/whatsapp";
import {
  MapPin,
  PhoneCall,
  Share2,
  AlertCircle,
  FileText,
  RotateCcw,
  Copy,
  Check,
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
  const [copied, setCopied] = useState(false);
  const isLikelyEligible = eligibilityResult?.verdict === "LIKELY_ELIGIBLE";
  const amount = isLikelyEligible ? eligibilityResult?.amountInr : undefined;
  const docs: DocKey[] = eligibilityResult?.documents || [
    "aadhaar",
    "bank_passbook",
    "mother_child_card",
    "photo",
  ];
  const needsAccountHelp = eligibilityResult?.needsAccountHelp ?? false;

  const whatsappUrl = getWhatsAppShareUrl({
    lang,
    schemeTitle,
    verdict: eligibilityResult?.verdict,
    amount,
    documents: docs,
  });

  const handleCopy = async () => {
    try {
      const rawText = buildWhatsAppMessage({
        lang,
        schemeTitle,
        verdict: eligibilityResult?.verdict,
        amount,
        documents: docs,
      });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = rawText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Failed to copy:", err);
    }
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
            label={t(lang, "handoff_card_title")}
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
              {t(lang, "you_may_qualify")}
            </span>
          </div>
        ) : (
          <p className="text-base font-bold text-gray-800 my-2">
            {discoveryScheme?.benefit || t(lang, "consult_worker")}
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
          <span>{t(lang, "documents_to_carry")}</span>
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

        {/* 3. WhatsApp Share & Fallback Copy */}
        <div className="w-full flex flex-col gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
            aria-label={t(lang, "share_with_worker")}
          >
            <BigButton
              variant="green"
              className="w-full text-base sm:text-lg min-h-[58px]"
              icon={<Share2 className="w-6 h-6 text-white flex-shrink-0" />}
            >
              {t(lang, "share_with_worker")}
            </BigButton>
          </a>

          {/* Direct Copy Fallback */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-3 text-xs sm:text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-brutal-sm"
            aria-label={copied ? t(lang, "copied") : t(lang, "copy_summary")}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-700" />
            ) : (
              <Copy className="w-4 h-4 text-gray-700" />
            )}
            <span>{copied ? t(lang, "copied") : t(lang, "copy_summary")}</span>
          </button>
        </div>
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
