import en from "../i18n/en.json";
import hi from "../i18n/hi.json";
import ta from "../i18n/ta.json";
import type { Lang } from "../types";

export type TranslationKey = keyof typeof en;

const translations: Record<Lang, Record<string, string>> = {
  en,
  hi,
  ta,
};

export function t(
  lang: Lang,
  key: TranslationKey | string,
  params?: Record<string, string | number>
): string {
  const table = translations[lang] || translations.en;
  let text = table[key];

  if (!text) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing key "${key}" for language "${lang}". Falling back to English.`);
    }
    text = translations.en[key] || key;
  }

  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value));
    }
  }

  return text;
}
