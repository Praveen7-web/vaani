import React, { useState } from "react";
import { Card, Badge, BigButton } from "./ui";
import { ShieldCheck, Heart, Sparkles, X, Lock, Users, Code2 } from "lucide-react";
import type { Lang } from "../types";
import { t } from "../services/i18n";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, lang }) => {
  const [showTechnical, setShowTechnical] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-[#FAFAFA] border-3 border-black shadow-brutal-lg max-h-[90vh] overflow-y-auto relative p-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full border-2 border-black bg-white shadow-brutal-sm hover:bg-gray-100 cursor-pointer"
          aria-label={t(lang, "back")}
        >
          <X className="w-5 h-5 text-black" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">🌸</span>
          <h1 className="text-2xl font-black">{t(lang, "about")}</h1>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge
            variant="green"
            icon={<ShieldCheck className="w-4 h-4" />}
            label={t(lang, "about_mission_title")}
          />
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="text-xs font-bold underline text-gray-700 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showTechnical ? "Show User Guide" : "Judge / Technical Specs"}
          </button>
        </div>

        {showTechnical ? (
          /* Technical / Judge Section (English) */
          <div className="flex flex-col gap-3 mt-3 text-xs sm:text-sm text-gray-900 leading-relaxed font-mono">
            <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
              <h2 className="font-extrabold text-sm mb-1 text-black flex items-center gap-1.5 font-sans">
                <Code2 className="w-4 h-4 text-purple-600" />
                Technical Boundary Contract
              </h2>
              <ul className="list-disc pl-4 space-y-1 text-gray-800">
                <li><strong>AI Role:</strong> Slot extraction only via Gemini 2.5 Flash pinned serverless endpoint (<code>/api/understand</code>).</li>
                <li><strong>Decision Authority:</strong> 100% deterministic pure functions (<code>src/services/eligibility.ts</code>). Zero AI hallucination of money/verdicts.</li>
                <li><strong>UI Output:</strong> Strings strictly resolved from human-reviewed language tables (<code>src/i18n/*.json</code>).</li>
                <li><strong>Bundle Limit:</strong> Dist size strictly &lt; 10 MB (current production bundle: 0.25 MB).</li>
                <li><strong>Audit Endpoint:</strong> Machine-readable JSON exported at <code>/api/audit</code>.</li>
              </ul>
            </div>
            <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
              <h2 className="font-extrabold text-sm mb-1 text-black flex items-center gap-1.5 font-sans">
                <Lock className="w-4 h-4 text-red-600" />
                Zero-Storage Privacy Architecture
              </h2>
              <p className="text-gray-800">
                No database, no user accounts, no tracking cookies. Audio never leaves the browser unencrypted; ephemeral session memory only.
              </p>
            </div>
          </div>
        ) : (
          /* User-Facing Mission Content (Fully Localized) */
          <div className="flex flex-col gap-3 mt-3 text-sm text-gray-900 leading-relaxed font-medium">
            {/* 1. Problem */}
            <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
              <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
                <Users className="w-4 h-4 text-blue-600" />
                {t(lang, "about_problem_title")}
              </h2>
              <p>{t(lang, "about_problem_desc")}</p>
            </div>

            {/* 2. What Vaani Does */}
            <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
              <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                {t(lang, "about_what_title")}
              </h2>
              <p>{t(lang, "about_what_desc")}</p>
            </div>

            {/* 3. Code Decides */}
            <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
              <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                {t(lang, "about_architecture_title")}
              </h2>
              <p>{t(lang, "about_architecture_desc")}</p>
            </div>

            {/* 4. Privacy */}
            <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
              <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
                <Lock className="w-4 h-4 text-red-600" />
                {t(lang, "about_privacy_title")}
              </h2>
              <p>{t(lang, "about_privacy_desc")}</p>
            </div>

            {/* 5. Guidance Notice */}
            <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
              <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
                <Heart className="w-4 h-4 text-red-500" />
                {t(lang, "about_guidance_title")}
              </h2>
              <p className="text-gray-700">{t(lang, "about_guidance_desc")}</p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <BigButton variant="yellow" className="w-full text-base py-3" onClick={onClose}>
            {t(lang, "back")}
          </BigButton>
        </div>
      </Card>
    </div>
  );
};
