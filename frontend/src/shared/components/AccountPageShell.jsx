import { ArrowLeft, MessageCircle, Settings2, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { cn } from "@/lib/utils";

const accountLinks = [
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

export function AccountPageShell({ children }) {
  return (
    <div className="min-h-full bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/chat" className="flex items-center gap-2.5" aria-label="Back to ClickChat">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MessageCircle className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">ClickChat</span>
          </Link>

          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link to="/chat">
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Back to chats</span>
              </Link>
            </Button>
            <ModeToggle />
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 sm:px-6" aria-label="Account pages">
          {accountLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                "flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex-none",
                isActive && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
