import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import LocalizedText from "./LocalizedText";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";
import { ReactNode } from "react";

export interface SectionCardProps {
  title?: DynamicState;
  action?: DynamicState;
  children?: ReactNode;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function SectionCard({ title, action, children, className = "" }: SectionCardProps) {
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
