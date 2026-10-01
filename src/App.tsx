import React, { useState } from "react";
import { BigButton, Card, Badge } from "./components/ui";
import { t } from "./services/i18n";
import type { Lang } from "./types";
import { ShieldCheck, Heart } from "lucide-react";

export const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>("hi");

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto">
      {/* Header status */}
      <header className="flex items-center justify-between py-2 border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌸</span>
          <span className="font-extrabold text-2xl tracking-wide">Vaani</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="green"
            icon={<ShieldCheck className="w-4 h-4" />}
            label="100% Private"
          />
        </div>
      </header>

      {/* Main greeting content */}
      <main className="flex-1 flex flex-col justify-center items-center py-8 gap-6">
        <Card className="w-full text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 leading-snug">
            {t(lang, "greeting")}
          </h1>
          <p className="text-lg text-gray-700 font-medium">
            {t(lang, "safety_notice")}
          </p>
        </Card>

        {/* Language selector buttons */}
        <div className="w-full flex flex-col gap-3">
          <p className="text-center font-bold text-lg mb-1">अपनी भाषा चुनें / Choose Language:</p>
          <div className="grid grid-cols-3 gap-3">
            <BigButton
              variant={lang === "hi" ? "yellow" : "white"}
              onClick={() => setLang("hi")}
            >
              हिन्दी
            </BigButton>
            <BigButton
              variant={lang === "ta" ? "yellow" : "white"}
              onClick={() => setLang("ta")}
            >
              தமிழ்
            </BigButton>
            <BigButton
              variant={lang === "en" ? "yellow" : "white"}
              onClick={() => setLang("en")}
            >
              English
            </BigButton>
          </div>
        </div>
      </main>

      {/* Footer strictly for judges and dev links */}
      <footer className="text-xs text-gray-500 border-t border-gray-300 pt-3 text-center flex flex-col gap-1 select-none">
        <p className="flex items-center justify-center gap-1">
          Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> for rural empowerment
        </p>
        <p>
          Lead Developer: P Praveen Pandi | PMMVY Deep Flow + Scheme Registry
        </p>
      </footer>
    </div>
  );
};

export default App;
