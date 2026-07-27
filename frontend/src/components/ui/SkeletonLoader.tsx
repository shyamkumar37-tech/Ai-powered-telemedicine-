import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
export interface SkeletonLoaderProps {
  lines?: DynamicState;
  className?: DynamicState;
  lineClassName?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function SkeletonLoader({
  lines = 3,
  className = "",
  lineClassName = "h-4 rounded-full"
}: SkeletonLoaderProps) {
  return (
    <div className={["space-y-3", className].join(" ")}>
      {Array.from({ length: lines }).map((_: DynamicStateObject, index: number | string) => (
        <div
          key={`skeleton-${index}`}
          className={["tc-skeleton", lineClassName, index === lines - 1 ? "w-4/5" : "w-full"].join(" ")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
