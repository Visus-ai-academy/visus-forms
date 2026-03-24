import { Skeleton } from "@/components/ui/skeleton";

export default function BuilderLoading() {
  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Header */}
      <div className="h-14 border-b border-surface-container-low px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-72 border-r border-surface-container-low p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-surface-container-lowest p-4 space-y-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 flex justify-center">
          <div className="w-full max-w-xl space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
