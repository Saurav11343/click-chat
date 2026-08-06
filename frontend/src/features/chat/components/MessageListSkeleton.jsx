import { Skeleton } from "@/components/ui/skeleton";

const FULL_ROWS = [
  { side: "left", width: "w-44 sm:w-56", height: "h-14" },
  { side: "right", width: "w-36 sm:w-48", height: "h-11" },
  { side: "left", width: "w-52 sm:w-64", height: "h-16" },
  { side: "right", width: "w-44 sm:w-56", height: "h-12" },
  { side: "left", width: "w-32 sm:w-44", height: "h-10" },
];

const COMPACT_ROWS = [
  { side: "left", width: "w-40 sm:w-52", height: "h-10" },
  { side: "right", width: "w-32 sm:w-44", height: "h-9" },
];

export function MessageListSkeleton({ compact = false, showSenders = false }) {
  const rows = compact ? COMPACT_ROWS : FULL_ROWS;

  return (
    <div
      className={`w-full ${
        compact
          ? "space-y-3 py-2"
          : "flex min-h-full flex-1 flex-col justify-end gap-3 pb-6 pt-12 sm:pb-8"
      }`}
      role="status"
      aria-label={compact ? "Loading older messages" : "Loading messages"}
    >
      {!compact && (
        <div className="flex items-center gap-3 pb-3">
          <Skeleton className="h-px flex-1 rounded-none" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-px flex-1 rounded-none" />
        </div>
      )}

      {rows.map((row, index) => (
        <div
          key={`${row.side}-${index}`}
          className={`flex ${row.side === "right" ? "justify-end" : "justify-start"}`}
        >
          <div className="space-y-1.5">
            {row.side === "left" && !compact && showSenders && (
              <Skeleton className="h-2.5 w-20 rounded-full" />
            )}
            <Skeleton
              className={`${row.height} ${row.width} max-w-[72vw] rounded-2xl ${
                row.side === "right"
                  ? "chat-skeleton-sent rounded-br-sm"
                  : "chat-skeleton-received rounded-bl-sm"
              }`}
            />
          </div>
        </div>
      ))}

      <span className="sr-only">
        {compact ? "Loading older messages..." : "Loading messages..."}
      </span>
    </div>
  );
}
