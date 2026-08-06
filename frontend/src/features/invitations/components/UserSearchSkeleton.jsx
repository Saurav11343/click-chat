import { Skeleton } from "@/components/ui/skeleton";

export function UserSearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border p-3"
        >
          <Skeleton className="size-11 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>

          <Skeleton className="h-9 w-20 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}
