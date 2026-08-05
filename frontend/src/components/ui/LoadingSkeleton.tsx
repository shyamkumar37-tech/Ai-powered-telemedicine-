import { DynamicState } from "./../../types/DynamicState";
export interface LoadingSkeletonProps {
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function LoadingSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 animate-pulse flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
      </div>
    </div>
  );
}
