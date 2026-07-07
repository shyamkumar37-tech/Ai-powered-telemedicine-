import LocalizedText from "./LocalizedText";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";

export default function AlertStrip({ items }) {
  const { language } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;

  if (!items?.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700 shadow-sm"
        >
          <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-red-100 text-xs font-bold text-red-600">
            !
          </span>
          <LocalizedText value={item} />
        </div>
      ))}
    </div>
  );
}
