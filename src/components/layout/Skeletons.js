import Skeleton from "@/components/ui/Skeleton";

export function HomeSkeleton() {
  return (
    <div className="columns-1 md:columns-2 gap-6 md:gap-10">
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="flex flex-col break-inside-avoid mb-10">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-5" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function PhotosSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-xl" />
      ))}
    </div>
  );
}
