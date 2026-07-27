import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import LocalizedText from "../../components/LocalizedText";

export interface AiInsightBlockProps {
  title?: DynamicState;
  subtitle?: DynamicState;
  items?: DynamicState;
  rationale?: DynamicState;
  disclaimer?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiInsightBlock({ title, subtitle, items = [], rationale = [], disclaimer }: AiInsightBlockProps) {
  return (
    <div className="rounded-2xl bg-mist p-4 text-sm text-slate-700">
      {title ? <p className="font-semibold">{title}</p> : null}
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      {items.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {items.map((item: DynamicStateObject) => <li key={item}><LocalizedText value={item} /></li>)}
        </ul>
      ) : null}
      {rationale.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
          {rationale.map((item: DynamicStateObject) => <li key={item}><LocalizedText value={item} /></li>)}
        </ul>
      ) : null}
      {disclaimer ? <p className="mt-2 text-xs text-slate-500">{disclaimer}</p> : null}
    </div>
  );
}
