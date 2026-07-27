import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
export interface SkeletonProps {
  variant?: DynamicState;
  lines?: DynamicState;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function Skeleton({
  variant = "text",
  lines = 1,
  className = ""
}: SkeletonProps) {
  if (variant === "avatar") {
    return <div className={["tc-skeleton rounded-full", "h-12 w-12", className].join(" ")} aria-hidden="true" />;
  }

  if (variant === "card") {
    return (
      <div className={["space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm", className].join(" ")}>
        <div className="tc-skeleton h-5 w-1/3 rounded-full" aria-hidden="true" />
        <div className="tc-skeleton h-20 w-full rounded-[1rem]" aria-hidden="true" />
        <div className="tc-skeleton h-4 w-2/3 rounded-full" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={["space-y-3", className].join(" ")}>
      {Array.from({ length: lines }).map((_: DynamicStateObject, index: number | string) => (
        <div
          key={`skeleton-line-${index}`}
          className={["tc-skeleton h-4 rounded-full", index === lines - 1 ? "w-4/5" : "w-full"].join(" ")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
