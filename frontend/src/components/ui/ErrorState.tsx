import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useLanguage } from "../../context/LanguageContext";
export interface ErrorStateProps {
  title?: DynamicState;
  description?: DynamicState;
  action?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function ErrorState({ title = "Something went wrong", description, action }: ErrorStateProps) {
  const { t } = useLanguage();
  return (
    <div className="glass-card border border-red-100 bg-red-50/80 p-6 text-red-700">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400">{t("error") || "Error"}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 text-sm text-red-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
