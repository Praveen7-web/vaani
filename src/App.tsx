import React, { useReducer, useEffect, useRef, useCallback } from "react";
import {
  conversationReducer,
  initialState,
} from "./state/conversationReducer";
import { BigButton, Card, MicButton, Badge } from "./components/ui";
import { t } from "./services/i18n";
import { localParse } from "./services/localParse";
import { evaluate } from "./services/eligibility";
import {
  createSpeechRecognizer,
  speakText,
  stopSpeaking,
} from "./services/voice";
import type { StateCode, Situation, ChildOrder } from "./types";
import {
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  Volume2,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(conversationReducer, initialState);
  const recognitionRef = useRef<any>(null);

  // Helper to pronounce prompts automatically on screen entry
  const speakCurrentPrompt = useCallback(
    (prompt: string) => {
      speakText(prompt, state.lang);
    },
    [state.lang]
  );

  // Stop ongoing speech on screen transition
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [state.step, state.currentSlot]);

  // Read prompt on screen entry
  useEffect(() => {
    switch (state.step) {
      case "GREETING_AND_SAFETY":
        speakCurrentPrompt(
          `${t(state.lang, "greeting")} ${t(state.lang, "safety_notice")}`
        );
        break;
      case "ASK_INTENT":
        speakCurrentPrompt(t(state.lang, "ask_intent"));
        break;
      case "ASK_STATE":
        speakCurrentPrompt(t(state.lang, "ask_state"));
        break;
      case "ASK_SLOT":
        if (state.currentSlot) {
          const key = `ask_${state.currentSlot === "babyAgeMonths" ? "baby_age" : state.currentSlot === "childOrder" ? "child_order" : state.currentSlot === "secondChildIsGirl" ? "second_child_girl" : state.currentSlot === "govtEmployee" ? "govt_job" : state.currentSlot === "hasQualifyingCard" ? "qualifying_card" : state.currentSlot === "hasBankOrPostAccount" ? "account" : state.currentSlot}`;
          speakCurrentPrompt(t(state.lang, key));
        }
        break;
      case "CONFIRM_SLOT":
        if (state.pendingSlot) {
          speakCurrentPrompt(
            t(state.lang, "confirm_template", {
              value: state.pendingSlot.displayValue,
            })
          );
        }
        break;
      case "PMMVY_RESULT": {
        const res = evaluate(state.profile);
        if (res.verdict === "LIKELY_ELIGIBLE") {
          speakCurrentPrompt(
            t(state.lang, "result_likely_eligible", {
              amount: res.amountInr || 5000,
            })
          );
        } else if (res.verdict === "ASK_WORKER") {
          speakCurrentPrompt(t(state.lang, `result_ask_worker_${res.reason}`));
        } else {
          speakCurrentPrompt(t(state.lang, `result_not_${res.reason}`));
        }
        break;
      }
      case "DISCOVERY_CARDS": {
        const scheme = state.discoveryList[state.discoveryIndex];
        if (scheme) {
          speakCurrentPrompt(
            `${scheme.name}. ${scheme.benefit}. ${t(state.lang, "ask_worker_to_confirm")}`
          );
        }
        break;
      }
    }
  }, [state.step, state.currentSlot, state.pendingSlot, state.discoveryIndex, state.lang, speakCurrentPrompt, state.profile]);

  // Setup Voice Recognizer
  const startListening = () => {
    if (!state.speechSupported) {
      dispatch({ type: "RECORD_FAILED_ATTEMPT", payload: state.currentSlot || "general" });
      return;
    }

    stopSpeaking();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // no-op
      }
    }

    dispatch({ type: "SET_LISTENING", payload: true });

    const recognizer = createSpeechRecognizer(
      state.lang,
      (transcript) => {
        dispatch({ type: "SET_TRANSCRIPT", payload: transcript });
        dispatch({ type: "SET_LISTENING", payload: false });

        // Parse transcript with zero AI local parser
        const parsed = localParse(state.currentSlot, transcript, state.lang);

        if (state.currentSlot && parsed[state.currentSlot] !== undefined) {
          const val = parsed[state.currentSlot];
          let displayVal = String(val);

          if (state.currentSlot === "intent") {
            displayVal = t(state.lang, `intent_${val}`);
          } else if (state.currentSlot === "state") {
            displayVal = t(state.lang, `state_${val}_native`);
          } else if (state.currentSlot === "situation") {
            displayVal = t(state.lang, `situation_${val}`);
          } else if (state.currentSlot === "childOrder") {
            displayVal = t(state.lang, `child_order_${val}`);
          } else if (typeof val === "boolean") {
            displayVal = val ? t(state.lang, "yes") : t(state.lang, "no");
          }

          dispatch({
            type: "PROPOSE_SLOT",
            payload: {
              key: state.currentSlot,
              value: val,
              displayValue: displayVal,
            },
          });
        } else {
          // Unrecognized utterance -> gentle repeat / increment attempts
          dispatch({
            type: "RECORD_FAILED_ATTEMPT",
            payload: state.currentSlot || "general",
          });
          speakCurrentPrompt(t(state.lang, "try_again"));
        }
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        dispatch({ type: "SET_LISTENING", payload: false });
        dispatch({
          type: "RECORD_FAILED_ATTEMPT",
          payload: state.currentSlot || "general",
        });
      },
      () => {
        dispatch({ type: "SET_LISTENING", payload: false });
      }
    );

    recognitionRef.current = recognizer;
    try {
      recognizer?.start();
    } catch {
      dispatch({ type: "SET_LISTENING", payload: false });
    }
  };

  // Direct Tap Handlers
  const handlePropose = (key: any, value: any, displayValue: string) => {
    stopSpeaking();
    dispatch({
      type: "PROPOSE_SLOT",
      payload: { key, value, displayValue },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black flex flex-col justify-between p-3 sm:p-5 max-w-lg mx-auto select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 border-b-3 border-black pb-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden="true">🌸</span>
          <span className="font-extrabold text-2xl tracking-wide">Vaani</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="green"
            icon={<ShieldCheck className="w-4 h-4" />}
            label="100% Private"
          />
          {state.step !== "LANGUAGE_PICK" && (
            <button
              type="button"
              onClick={() => dispatch({ type: "START_OVER" })}
              className="p-2 border-2 border-black rounded-xl bg-white shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
              aria-label={t(state.lang, "start_again")}
              title={t(state.lang, "start_again")}
            >
              <RotateCcw className="w-5 h-5 text-black" />
            </button>
          )}
        </div>
      </header>

      {/* Main Single-Screen Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center py-4 sm:py-6 w-full">
        {/* SCREEN 1: LANGUAGE PICK */}
        {state.step === "LANGUAGE_PICK" && (
          <div className="w-full flex flex-col gap-6 items-center">
            <Card className="w-full text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
                अपनी भाषा चुनें / மொழி தேர்வு
              </h1>
              <p className="text-lg text-gray-700 font-semibold">
                Choose your language to begin
              </p>
            </Card>

            <div className="w-full flex flex-col gap-4">
              <BigButton
                size="large"
                variant="yellow"
                onClick={() => dispatch({ type: "SET_LANGUAGE", payload: "hi" })}
              >
                🇮🇳 हिन्दी (Hindi)
              </BigButton>
              <BigButton
                size="large"
                variant="yellow"
                onClick={() => dispatch({ type: "SET_LANGUAGE", payload: "ta" })}
              >
                🇮🇳 தமிழ் (Tamil)
              </BigButton>
              <BigButton
                size="large"
                variant="white"
                onClick={() => dispatch({ type: "SET_LANGUAGE", payload: "en" })}
              >
                🌐 English
              </BigButton>
            </div>
          </div>
        )}

        {/* SCREEN 2: GREETING & SAFETY */}
        {state.step === "GREETING_AND_SAFETY" && (
          <div className="w-full flex flex-col gap-6 items-center">
            <Card className="w-full text-center">
              <div className="w-16 h-16 bg-[#FFD600] rounded-full border-3 border-black shadow-brutal flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
                {t(state.lang, "greeting")}
              </h1>
              <p className="text-lg text-gray-800 font-semibold mt-2">
                {t(state.lang, "safety_notice")}
              </p>
            </Card>

            <BigButton
              size="large"
              variant="yellow"
              className="w-full"
              icon={<ChevronRight className="w-7 h-7" />}
              onClick={() => dispatch({ type: "ACKNOWLEDGE_GREETING" })}
            >
              {t(state.lang, "continue")}
            </BigButton>
          </div>
        )}

        {/* SCREEN 3: ASK INTENT */}
        {state.step === "ASK_INTENT" && (
          <div className="w-full flex flex-col gap-4 items-center">
            <Card className="w-full text-center">
              <h1 className="text-2xl font-extrabold">
                {t(state.lang, "ask_intent")}
              </h1>
            </Card>

            {/* Mic Pulse Button */}
            {!state.forceTaps && (
              <MicButton
                isListening={state.isListening}
                onClick={startListening}
                label={
                  state.isListening
                    ? t(state.lang, "listening")
                    : t(state.lang, "tap_to_speak")
                }
              />
            )}

            {/* Picture Tap Buttons (Big icons, high contrast) */}
            <div className="w-full grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
              <BigButton
                variant="yellow"
                onClick={() =>
                  handlePropose(
                    "intent",
                    "pregnant_or_nursing",
                    t(state.lang, "intent_pregnant_or_nursing")
                  )
                }
              >
                🤰 {t(state.lang, "intent_pregnant_or_nursing")}
              </BigButton>

              <BigButton
                variant="white"
                onClick={() =>
                  handlePropose(
                    "intent",
                    "girl_child_savings",
                    t(state.lang, "intent_girl_child_savings")
                  )
                }
              >
                👧 {t(state.lang, "intent_girl_child_savings")}
              </BigButton>

              <BigButton
                variant="white"
                onClick={() =>
                  handlePropose(
                    "intent",
                    "monthly_income_support",
                    t(state.lang, "intent_monthly_income_support")
                  )
                }
              >
                🪙 {t(state.lang, "intent_monthly_income_support")}
              </BigButton>

              <BigButton
                variant="white"
                onClick={() =>
                  handlePropose(
                    "intent",
                    "cooking_fuel",
                    t(state.lang, "intent_cooking_fuel")
                  )
                }
              >
                ⛽ {t(state.lang, "intent_cooking_fuel")}
              </BigButton>

              <BigButton
                variant="white"
                onClick={() =>
                  handlePropose(
                    "intent",
                    "free_travel",
                    t(state.lang, "intent_free_travel")
                  )
                }
              >
                🚌 {t(state.lang, "intent_free_travel")}
              </BigButton>

              <BigButton
                variant="white"
                onClick={() =>
                  handlePropose(
                    "intent",
                    "start_business",
                    t(state.lang, "intent_start_business")
                  )
                }
              >
                🏪 {t(state.lang, "intent_start_business")}
              </BigButton>
            </div>
          </div>
        )}

        {/* SCREEN 4: ASK STATE */}
        {state.step === "ASK_STATE" && (
          <div className="w-full flex flex-col gap-4 items-center">
            <Card className="w-full text-center">
              <h1 className="text-2xl font-extrabold">
                {t(state.lang, "ask_state")}
              </h1>
            </Card>

            {!state.forceTaps && (
              <MicButton
                isListening={state.isListening}
                onClick={startListening}
                label={
                  state.isListening
                    ? t(state.lang, "listening")
                    : t(state.lang, "tap_to_speak")
                }
              />
            )}

            <div className="w-full grid grid-cols-2 gap-2.5 max-h-[310px] overflow-y-auto p-1">
              {(
                [
                  ["TN", "Tamil Nadu"],
                  ["TS", "Telangana"],
                  ["KA", "Karnataka"],
                  ["MH", "Maharashtra"],
                  ["MP", "Madhya Pradesh"],
                  ["WB", "West Bengal"],
                  ["UP", "Uttar Pradesh"],
                  ["RJ", "Rajasthan"],
                  ["AP", "Andhra Pradesh"],
                  ["AS", "Assam"],
                ] as [StateCode, string][]
              ).map(([code]) => (
                <BigButton
                  key={code}
                  variant="white"
                  className="text-lg py-3 min-h-[60px]"
                  onClick={() =>
                    handlePropose(
                      "state",
                      code,
                      t(state.lang, `state_${code}_native`)
                    )
                  }
                >
                  {t(state.lang, `state_${code}_native`)}
                </BigButton>
              ))}

              <BigButton
                variant="yellow"
                className="col-span-2 text-lg py-3 min-h-[60px]"
                onClick={() =>
                  handlePropose("state", "OTHER", t(state.lang, "state_OTHER"))
                }
              >
                {t(state.lang, "state_OTHER")}
              </BigButton>
            </div>
          </div>
        )}

        {/* SCREEN 5: ASK PMMVY SLOTS */}
        {state.step === "ASK_SLOT" && state.currentSlot && (
          <div className="w-full flex flex-col gap-4 items-center">
            <Card className="w-full text-center">
              <h1 className="text-2xl font-extrabold leading-snug">
                {t(
                  state.lang,
                  `ask_${
                    state.currentSlot === "babyAgeMonths"
                      ? "baby_age"
                      : state.currentSlot === "childOrder"
                      ? "child_order"
                      : state.currentSlot === "secondChildIsGirl"
                      ? "second_child_girl"
                      : state.currentSlot === "govtEmployee"
                      ? "govt_job"
                      : state.currentSlot === "hasQualifyingCard"
                      ? "qualifying_card"
                      : state.currentSlot === "hasBankOrPostAccount"
                      ? "account"
                      : state.currentSlot
                  }`
                )}
              </h1>
            </Card>

            {!state.forceTaps && (
              <MicButton
                isListening={state.isListening}
                onClick={startListening}
                label={
                  state.isListening
                    ? t(state.lang, "listening")
                    : t(state.lang, "tap_to_speak")
                }
              />
            )}

            {/* Slot-specific Tap Buttons */}
            {state.currentSlot === "situation" && (
              <div className="w-full flex flex-col gap-3">
                <BigButton
                  variant="yellow"
                  size="large"
                  onClick={() =>
                    handlePropose(
                      "situation",
                      "pregnant" as Situation,
                      t(state.lang, "situation_pregnant")
                    )
                  }
                >
                  🤰 {t(state.lang, "situation_pregnant")}
                </BigButton>
                <BigButton
                  variant="white"
                  size="large"
                  onClick={() =>
                    handlePropose(
                      "situation",
                      "newborn_mother" as Situation,
                      t(state.lang, "situation_newborn_mother")
                    )
                  }
                >
                  👶 {t(state.lang, "situation_newborn_mother")}
                </BigButton>
                <BigButton
                  variant="white"
                  size="large"
                  onClick={() =>
                    handlePropose(
                      "situation",
                      "neither" as Situation,
                      t(state.lang, "situation_neither")
                    )
                  }
                >
                  ✖ {t(state.lang, "situation_neither")}
                </BigButton>
              </div>
            )}

            {state.currentSlot === "age" && (
              <div className="w-full grid grid-cols-3 gap-3">
                {[18, 19, 20, 22, 24, 26, 28, 30, 32].map((num) => (
                  <BigButton
                    key={num}
                    variant={num >= 19 ? "white" : "white"}
                    className="text-2xl font-black"
                    onClick={() =>
                      handlePropose("age", num, `${num} ${t(state.lang, "ask_age") ? "years" : ""}`)
                    }
                  >
                    {num}
                  </BigButton>
                ))}
              </div>
            )}

            {state.currentSlot === "babyAgeMonths" && (
              <div className="w-full flex flex-col gap-3">
                {[
                  { m: 2, label: "2 months (2 महीने / 2 மாதம்)" },
                  { m: 5, label: "5 months (5 महीने / 5 மாதம்)" },
                  { m: 8, label: "8 months (8 महीने / 8 மாதம்)" },
                  { m: 11, label: "10+ months (10+ महीने / 10+ மாதம்)" },
                ].map(({ m, label }) => (
                  <BigButton
                    key={m}
                    variant="white"
                    size="large"
                    onClick={() => handlePropose("babyAgeMonths", m, label)}
                  >
                    👶 {label}
                  </BigButton>
                ))}
              </div>
            )}

            {state.currentSlot === "childOrder" && (
              <div className="w-full flex flex-col gap-3">
                <BigButton
                  variant="yellow"
                  size="large"
                  onClick={() =>
                    handlePropose(
                      "childOrder",
                      "first" as ChildOrder,
                      t(state.lang, "child_order_first")
                    )
                  }
                >
                  1️⃣ {t(state.lang, "child_order_first")}
                </BigButton>
                <BigButton
                  variant="white"
                  size="large"
                  onClick={() =>
                    handlePropose(
                      "childOrder",
                      "second" as ChildOrder,
                      t(state.lang, "child_order_second")
                    )
                  }
                >
                  2️⃣ {t(state.lang, "child_order_second")}
                </BigButton>
                <BigButton
                  variant="white"
                  size="large"
                  onClick={() =>
                    handlePropose(
                      "childOrder",
                      "later" as ChildOrder,
                      t(state.lang, "child_order_later")
                    )
                  }
                >
                  3️⃣ {t(state.lang, "child_order_later")}
                </BigButton>
              </div>
            )}

            {(state.currentSlot === "secondChildIsGirl" ||
              state.currentSlot === "govtEmployee" ||
              state.currentSlot === "hasQualifyingCard" ||
              state.currentSlot === "hasBankOrPostAccount") && (
              <div className="w-full grid grid-cols-2 gap-4">
                <BigButton
                  variant="green"
                  size="large"
                  icon={<Check className="w-8 h-8" />}
                  onClick={() =>
                    handlePropose(state.currentSlot!, true, t(state.lang, "yes"))
                  }
                >
                  {t(state.lang, "yes")}
                </BigButton>
                <BigButton
                  variant="red"
                  size="large"
                  icon={<X className="w-8 h-8" />}
                  onClick={() =>
                    handlePropose(state.currentSlot!, false, t(state.lang, "no"))
                  }
                >
                  {t(state.lang, "no")}
                </BigButton>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 6: CONFIRM-BACK RULE */}
        {state.step === "CONFIRM_SLOT" && state.pendingSlot && (
          <div className="w-full flex flex-col gap-6 items-center">
            <Card className="w-full text-center">
              <span className="text-4xl mb-2 block" aria-hidden="true">👂</span>
              <p className="text-xl font-bold mb-2 text-gray-700">
                {t(state.lang, "confirm_template", {
                  value: `"${state.pendingSlot.displayValue}"`,
                })}
              </p>
            </Card>

            <div className="w-full grid grid-cols-2 gap-4">
              <BigButton
                variant="green"
                size="large"
                icon={<Check className="w-8 h-8" />}
                onClick={() => dispatch({ type: "CONFIRM_SLOT_YES" })}
              >
                ✔ {t(state.lang, "yes")}
              </BigButton>
              <BigButton
                variant="red"
                size="large"
                icon={<X className="w-8 h-8" />}
                onClick={() => dispatch({ type: "CONFIRM_SLOT_NO" })}
              >
                ✖ {t(state.lang, "no")}
              </BigButton>
            </div>
          </div>
        )}

        {/* SCREEN 7: PMMVY RESULT (Deterministic Verdict) */}
        {state.step === "PMMVY_RESULT" && (() => {
          const evalRes = evaluate(state.profile);
          const isEligible = evalRes.verdict === "LIKELY_ELIGIBLE";
          const isWorker = evalRes.verdict === "ASK_WORKER";

          return (
            <div className="w-full flex flex-col gap-4 items-center">
              <Card className="w-full text-center">
                <div
                  className={`w-16 h-16 rounded-full border-3 border-black shadow-brutal flex items-center justify-center mx-auto mb-3 ${
                    isEligible
                      ? "bg-[#22C55E] text-white"
                      : isWorker
                      ? "bg-[#FFD600] text-black"
                      : "bg-[#EF4444] text-white"
                  }`}
                >
                  {isEligible ? (
                    <Check className="w-10 h-10" />
                  ) : isWorker ? (
                    <Info className="w-10 h-10" />
                  ) : (
                    <X className="w-10 h-10" />
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">
                  {isEligible
                    ? t(state.lang, "result_likely_eligible", {
                        amount: evalRes.amountInr || 5000,
                      })
                    : isWorker
                    ? t(state.lang, `result_ask_worker_${evalRes.reason}`)
                    : t(state.lang, `result_not_${evalRes.reason}`)}
                </h1>

                {evalRes.needsAccountHelp && (
                  <p className="text-base font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200 mt-2">
                    {t(state.lang, "needs_account_warning")}
                  </p>
                )}

                <p className="text-sm text-gray-700 font-semibold mt-3">
                  {t(state.lang, "ask_worker_to_confirm")}
                </p>
              </Card>

              <BigButton
                size="large"
                variant="yellow"
                className="w-full"
                onClick={() => dispatch({ type: "VIEW_COMPANION_SCHEMES" })}
              >
                {t(state.lang, "continue")}
              </BigButton>
            </div>
          );
        })()}

        {/* SCREEN 8: DISCOVERY CARDS (max 3, one per screen) */}
        {state.step === "DISCOVERY_CARDS" && (() => {
          const scheme = state.discoveryList[state.discoveryIndex];
          if (!scheme) {
            return (
              <BigButton
                variant="yellow"
                onClick={() => dispatch({ type: "START_OVER" })}
              >
                {t(state.lang, "start_again")}
              </BigButton>
            );
          }

          return (
            <div className="w-full flex flex-col gap-5 items-center">
              <div className="flex items-center gap-1.5 mb-1">
                {state.discoveryList.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full border-2 border-black ${
                      idx === state.discoveryIndex ? "bg-[#FFD600]" : "bg-white"
                    }`}
                  />
                ))}
              </div>

              <Card className="w-full text-center">
                <span className="text-3xl block mb-2" aria-hidden="true">📜</span>
                <h1 className="text-2xl font-extrabold mb-3">{scheme.name}</h1>
                <p className="text-lg font-semibold text-gray-800 mb-3">
                  {scheme.benefit}
                </p>
                <div className="inline-block bg-yellow-100 border-2 border-black px-3 py-1 rounded-xl text-xs font-bold mt-1">
                  {t(state.lang, "ask_worker_to_confirm")}
                </div>
              </Card>

              <BigButton
                size="large"
                variant="yellow"
                className="w-full"
                onClick={() => dispatch({ type: "NEXT_DISCOVERY_CARD" })}
              >
                {state.discoveryIndex + 1 < state.discoveryList.length
                  ? t(state.lang, "next")
                  : t(state.lang, "done")}
              </BigButton>
            </div>
          );
        })()}

        {/* SCREEN 9: DONE */}
        {state.step === "DONE" && (
          <div className="w-full flex flex-col gap-6 items-center">
            <Card className="w-full text-center">
              <span className="text-4xl block mb-2" aria-hidden="true">🙏</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">
                {state.lang === "hi"
                  ? "जानकारी पूरी हुई"
                  : state.lang === "ta"
                  ? "தகவல் நிறைவடைந்தது"
                  : "Assistance Complete"}
              </h1>
              <p className="text-lg font-semibold text-gray-800">
                {t(state.lang, "ask_worker_to_confirm")}
              </p>
            </Card>

            <BigButton
              size="large"
              variant="yellow"
              className="w-full"
              onClick={() => dispatch({ type: "START_OVER" })}
            >
              {t(state.lang, "start_again")}
            </BigButton>
          </div>
        )}
      </main>

      {/* Footer strictly for judges and dev links */}
      <footer className="text-xs text-gray-600 border-t-2 border-black pt-2 text-center flex flex-col gap-1.5 select-none">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 border border-black inline-block"></span>
            AI: offline (local rules engine)
          </span>
          <span className="text-gray-500">
            {state.speechSupported ? "Mic: Ready" : "Mic: Tap Fallback"}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs font-bold mt-0.5">
          <a
            href="https://github.com/Praveen7-web/vaani.git"
            target="_blank"
            rel="noopener noreferrer"
            className="underline flex items-center gap-0.5 hover:text-black"
          >
            GitHub <ExternalLink className="w-3 h-3 inline" />
          </a>
          <span>•</span>
          <a
            href="https://www.linkedin.com/in/praveen-p-65a13b376"
            target="_blank"
            rel="noopener noreferrer"
            className="underline flex items-center gap-0.5 hover:text-black"
          >
            LinkedIn <ExternalLink className="w-3 h-3 inline" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
