import type { Lang } from "../types";

export interface SpeechRecognitionResultEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

const localeMap: Record<Lang, string> = {
  hi: "hi-IN",
  ta: "ta-IN",
  en: "en-IN",
};

export function getVoiceLocale(lang: Lang): string {
  return localeMap[lang] || "en-IN";
}

// Backward compatibility alias
export const getBcp47 = getVoiceLocale;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function createSpeechRecognizer(
  lang: Lang,
  onResult: (transcript: string) => void,
  onError: (err: any) => void,
  onEnd: () => void
) {
  if (!isSpeechRecognitionSupported()) return null;

  const win = window as unknown as IWindow;
  const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
  const recognizer = new SpeechRec();

  recognizer.lang = getVoiceLocale(lang);
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;

  recognizer.onresult = (event: SpeechRecognitionResultEvent) => {
    if (event.results && event.results[0] && event.results[0][0]) {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    }
  };

  recognizer.onerror = (error: any) => {
    onError(error);
  };

  recognizer.onend = () => {
    onEnd();
  };

  return recognizer;
}

export function speakText(
  text: string,
  lang: Lang,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  window.speechSynthesis.cancel(); // Stop ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  const locale = getVoiceLocale(lang);
  utterance.lang = locale;
  utterance.rate = 0.9; // Slightly slower, clearer for rural users

  // Try to find native voice matching requested locale
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) =>
      v.lang === locale ||
      v.lang.toLowerCase() === locale.toLowerCase() ||
      v.lang.replace("_", "-").toLowerCase().startsWith(lang)
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
