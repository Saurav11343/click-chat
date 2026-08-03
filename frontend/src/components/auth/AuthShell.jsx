import { ArrowLeft, Check, MessageCircle, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/ModeToggle";

const benefits = [
  "Direct and managed group conversations",
  "Rich media, GIFs, stickers, and translation",
  "Optional background browser notifications",
];

function AuthShell({ children }) {
  return (
    <div className="relative min-h-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_16%,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_28%),radial-gradient(circle_at_88%_82%,color-mix(in_oklab,var(--primary)_7%,transparent),transparent_24%)]" />

      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="ClickChat home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MessageCircle className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">ClickChat</span>
          </Link>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Back home
              </Link>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-full max-w-7xl items-center gap-14 px-4 pb-10 pt-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
        <section className="hidden max-w-lg lg:block">
          <span className="mb-7 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
            <MessagesSquare className="size-7" />
          </span>
          <p className="text-sm font-medium text-muted-foreground">WELCOME TO CLICKCHAT</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-balance">
            Conversations feel better when nothing gets in the way.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
            Sign in and get straight back to the people, messages, and moments that matter.
          </p>

          <div className="mt-9 space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm">
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3.5" />
                </span>
                {benefit}
              </div>
            ))}
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">{children}</section>
      </main>
    </div>
  );
}

export default AuthShell;
