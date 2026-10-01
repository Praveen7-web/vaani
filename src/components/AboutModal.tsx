import React from "react";
import { Card, Badge, BigButton } from "./ui";
import { ShieldCheck, Heart, Sparkles, X, Lock, Users } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-[#FAFAFA] border-3 border-black shadow-brutal-lg max-h-[90vh] overflow-y-auto relative p-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full border-2 border-black bg-white shadow-brutal-sm hover:bg-gray-100 cursor-pointer"
          aria-label="Close About Modal"
        >
          <X className="w-5 h-5 text-black" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">🌸</span>
          <h1 className="text-2xl font-black">About Vaani (वाणी)</h1>
        </div>

        <Badge
          variant="green"
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Voice-First Welfare Scheme Assistant"
        />

        <div className="flex flex-col gap-4 mt-4 text-sm text-gray-900 leading-relaxed font-medium">
          {/* 1. The Problem */}
          <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
            <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
              <Users className="w-4 h-4 text-blue-600" />
              The Problem We Solve
            </h2>
            <p>
              In rural India, <strong>48% of women have never used the internet</strong>. Complex government portals and language barriers mean vital welfare schemes like maternity cash assistance remain unclaimed.
            </p>
          </div>

          {/* 2. What Vaani Does */}
          <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
            <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              What Vaani Does
            </h2>
            <p>
              Vaani empowers first-time rural women to find out whether they qualify for essential benefits (like PMMVY ₹5,000–₹6,000 maternal support) entirely through <strong>voice or simple giant buttons in Hindi, Tamil, or English</strong>.
            </p>
          </div>

          {/* 3. How It Works (Strict Code Decides Rule) */}
          <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
            <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Code Decides — AI Only Listens
            </h2>
            <p>
              Unlike generic chatbots, <strong>AI never decides eligibility or quotes money</strong>. Gemini is strictly confined to extracting spoken answers into structured data. An auditable, deterministic rules engine makes all qualification decisions, and every sentence spoken aloud is a human-reviewed language table string.
            </p>
          </div>

          {/* 4. Privacy & Safety */}
          <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
            <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
              <Lock className="w-4 h-4 text-red-600" />
              100% Private & Safe
            </h2>
            <p>
              Vaani will <strong>never ask for Aadhaar numbers, bank account details, OTPs, or passwords</strong>. Audio is never recorded or stored; all session memory vanishes on page refresh.
            </p>
          </div>

          {/* 5. Last-Mile Human Handoff */}
          <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-brutal-sm">
            <h2 className="font-extrabold text-base flex items-center gap-1.5 mb-1 text-black">
              <Heart className="w-4 h-4 text-red-500" />
              Guidance Tool Notice
            </h2>
            <p className="text-gray-700">
              Vaani is an independent guidance tool, not an official government filing system. Every user journey concludes with a tangible Last-Mile Handoff Card linking directly to their nearest Anganwadi centre, Helpline 181, or local ASHA worker on WhatsApp.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <BigButton variant="yellow" className="w-full text-base py-3" onClick={onClose}>
            Back to Assistant
          </BigButton>
        </div>
      </Card>
    </div>
  );
};
