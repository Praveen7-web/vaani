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

export function getBcp47(lang: Lang): string {
  switch (lang) {
    case "hi":
      return "hi-IN";
    case "ta":
      return "ta-IN";
    case "en":
    default:
      return "en-IN";
  }
}

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

  recognizer.lang = getBcp47(lang);
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
  utterance.lang = getBcp47(lang);
  utterance.rate = 0.9; // Slightly slower, clearer for rural users

  // Try to find native voice
  const voices = window.speechSynthesis.getVoices();
  const bcp = getBcp47(lang);
  const matchedVoice = voices.find(
    (v) => v.lang === bcp || v.lang.replace("_", "-").startsWith(lang)
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
