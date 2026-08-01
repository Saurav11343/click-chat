import {
  ArrowRight,
  Check,
  CircleUserRound,
  MessageCircle,
  MessagesSquare,
  MonitorSmartphone,
  Pencil,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/ModeToggle";

const features = [
  {
    icon: Radio,
    title: "Truly real-time",
    description:
      "Messages, edits, deletes, and presence updates arrive the moment they happen.",
  },
  {
    icon: UserPlus,
    title: "Your circle, your choice",
    description:
      "Connect through invitations and keep conversations limited to people you accept.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description:
      "Verified accounts and secure cookie sessions keep access simple and protected.",
  },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="ClickChat home">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <MessageCircle className="size-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">ClickChat</span>
    </Link>
  );
}

function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0">
      <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />
      <Card className="gap-0 overflow-hidden rounded-3xl border-0 py-0 shadow-2xl shadow-primary/10 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3 border-b bg-card px-4 py-3.5 sm:px-5">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary text-primary-foreground">AR</AvatarFallback>
            <AvatarBadge className="bg-emerald-500" />
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">Alex Rivera</p>
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Online now
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/25" />
            <span className="size-2 rounded-full bg-muted-foreground/25" />
            <span className="size-2 rounded-full bg-muted-foreground/25" />
          </div>
        </div>

        <div className="min-h-80 space-y-4 bg-muted/35 p-4 sm:p-6">
          <div className="mx-auto w-fit rounded-full border bg-background px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
            Today
          </div>

          <div className="flex items-end gap-2">
            <Avatar size="sm">
              <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <div>
              <div className="max-w-64 rounded-2xl rounded-bl-sm bg-background px-4 py-2.5 text-sm shadow-sm ring-1 ring-foreground/5">
                Hey! Are we still on for tonight?
              </div>
              <span className="ml-1 mt-1 block text-[10px] text-muted-foreground">7:42 PM</span>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <div className="max-w-64 rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-left text-sm text-primary-foreground shadow-sm">
                Absolutely — I just sent everyone an invite.
              </div>
              <span className="mr-1 mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                7:43 PM <Check className="size-3" />
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Avatar size="sm">
              <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <div className="rounded-2xl rounded-bl-sm bg-background px-4 py-3 shadow-sm ring-1 ring-foreground/5">
              <div className="flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t bg-card p-3 sm:p-4">
          <div className="flex h-10 flex-1 items-center rounded-xl bg-muted px-4 text-sm text-muted-foreground">
            Type a message...
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Send className="size-4" />
          </span>
        </div>
      </Card>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl bg-background p-3 shadow-xl ring-1 ring-foreground/10 sm:flex">
        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CircleUserRound className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium">Friends online</p>
          <p className="text-[11px] text-muted-foreground">Ready when you are</p>
        </div>
      </div>
    </div>
  );
}

function Welcome() {
  return (
    <div className="min-h-full overflow-hidden bg-background">
      <header className="relative z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-2">
            <ModeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_28%),radial-gradient(circle_at_82%_35%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_25%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-28">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-6 h-7 gap-1.5 px-3">
                <Sparkles data-icon="inline-start" />
                Conversation, without the clutter
              </Badge>

              <h1 className="text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
                Stay close, one click at a time.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                A focused space for real-time conversations with the people who matter—fast, familiar, and easy to use.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-12 rounded-xl px-6 text-base">
                  <Link to="/register">
                    Start chatting free <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 rounded-xl px-6 text-base">
                  <Link to="/login">I already have an account</Link>
                </Button>
              </div>

              <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
                <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-card/70 px-2 py-3 text-center shadow-sm backdrop-blur-sm sm:min-h-0 sm:flex-row sm:justify-start sm:px-3 sm:text-left">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Check className="size-4" />
                  </span>
                  <span className="text-xs font-medium leading-tight sm:text-sm">Free to join</span>
                </div>
                <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-card/70 px-2 py-3 text-center shadow-sm backdrop-blur-sm sm:min-h-0 sm:flex-row sm:justify-start sm:px-3 sm:text-left">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Radio className="size-4" />
                  </span>
                  <span className="text-xs font-medium leading-tight sm:text-sm">Live presence</span>
                </div>
                <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-card/70 px-2 py-3 text-center shadow-sm backdrop-blur-sm sm:min-h-0 sm:flex-row sm:justify-start sm:px-3 sm:text-left">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <MonitorSmartphone className="size-4" />
                  </span>
                  <span className="text-xs font-medium leading-tight sm:text-sm">Across devices</span>
                </div>
              </div>
            </div>

            <ChatPreview />
          </div>
        </section>

        <section className="border-y bg-muted/35">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              [MessagesSquare, "Instant messages"],
              [Radio, "Live presence"],
              [Pencil, "Edit with ease"],
              [UserPlus, "Invite friends"],
            ].map(([Icon, label]) => (
              <div key={label} className="flex items-center justify-center gap-2.5 py-3 text-sm font-medium text-muted-foreground">
                <Icon className="size-4 text-foreground" />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">Built for connection</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Everything you need to keep the conversation moving
            </h2>
            <p className="mt-4 text-muted-foreground">
              ClickChat keeps the useful parts of modern messaging and leaves the noise behind.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="rounded-2xl py-6 transition-transform duration-300 hover:-translate-y-1">
                <CardHeader>
                  <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="pt-1 text-base leading-7">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <Card className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border-0 bg-primary py-0 text-primary-foreground ring-0">
            <div className="absolute -right-20 -top-24 size-72 rounded-full border border-primary-foreground/10" />
            <div className="absolute -bottom-36 -left-20 size-80 rounded-full border border-primary-foreground/10" />
            <CardContent className="relative flex flex-col items-center justify-between gap-8 px-6 py-12 text-center sm:px-12 lg:flex-row lg:py-14 lg:text-left">
              <div>
                <p className="text-sm font-medium text-primary-foreground/65">Your next conversation is waiting</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Ready to start clicking?</h2>
              </div>
              <Button size="lg" variant="secondary" asChild className="h-12 shrink-0 rounded-xl px-6">
                <Link to="/register">
                  Create your account <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <Brand />
          <p>Real-time conversations, made simple.</p>
          <div className="flex gap-5">
            <Link to="/login" className="transition-colors hover:text-foreground">Log in</Link>
            <Link to="/register" className="transition-colors hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Welcome;
