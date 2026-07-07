import LocalizedText from "./LocalizedText";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";

export default function SectionCard({ title, action, children, className = "" }) {
  const { language } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const localizedTitle = typeof title === "string"
    ? translateDisplayText(language, title)
    : title;

  return (
    <section className={`glass-card tc-card tc-tilt ${className}`.trim()}>
      <div className="tc-card__header">
        {typeof localizedTitle === "string"
          ? <h2 className="tc-card__title"><LocalizedText value={localizedTitle} minLength={4} /></h2>
          : <h2 className="tc-card__title">{localizedTitle}</h2>}
        {action ? <div className="tc-card__action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
