import Skeleton from "@/components/ui/Skeleton";

export function HomeSkeleton() {
  return (
    <div className="columns-1 md:columns-2 gap-8 space-y-8">
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="glass-card rounded-[2rem] p-8 break-inside-avoid">
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-[2rem]" />
        <Skeleton className="h-24 w-full rounded-[2rem]" />
        <Skeleton className="h-24 w-full rounded-[2rem]" />
      </div>
    </div>
  );
}

export function PhotosSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="aspect-square w-full rounded-[2rem] shadow-xl"
        />
      ))}
    </div>
  );
}
