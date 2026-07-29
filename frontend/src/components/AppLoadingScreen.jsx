import { MessageCircle, Radio, ShieldCheck } from "lucide-react";

export function AppLoadingScreen() {
  return (
    <div
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6"
      role="status"
      aria-live="polite"
      aria-label="Connecting to ClickChat"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_27%),radial-gradient(circle_at_20%_85%,color-mix(in_oklab,var(--primary)_4%,transparent),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative flex flex-col items-center text-center">
        <div className="relative flex size-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-border/70" />
          <span className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-r-primary border-t-primary" />
          <span className="absolute inset-3 animate-pulse rounded-full bg-primary/8" />
          <span className="relative flex size-15 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
            <MessageCircle className="size-7" strokeWidth={2.25} />
          </span>
        </div>

        <p className="mt-7 text-2xl font-semibold tracking-[-0.03em]">
          ClickChat
        </p>
        <p className="mt-2.5 text-sm text-muted-foreground">
          Preparing your conversations
        </p>

        <div
          className="mt-5 h-1 w-48 overflow-hidden rounded-full bg-muted"
          aria-hidden="true"
        >
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>

        <div className="mt-6 flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Radio className="size-3.5 text-emerald-500" />
            Real-time
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Secure session
          </span>
        </div>
      </div>
    </div>
  );
}
