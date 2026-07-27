import LoadingSkeleton from "./LoadingSkeleton";

export default function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse w-full">
      <div className="flex justify-between items-center w-full">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4"></div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LoadingSkeleton className="h-32 rounded-xl" />
        <LoadingSkeleton className="h-32 rounded-xl" />
        <LoadingSkeleton className="h-32 rounded-xl" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        <div className="lg:col-span-2">
          <LoadingSkeleton className="h-96 rounded-xl" />
        </div>
        <div className="lg:col-span-1">
          <LoadingSkeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
