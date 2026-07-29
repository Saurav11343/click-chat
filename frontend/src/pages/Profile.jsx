import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Mail,
  MessageCircle,
  Quote,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { useAuthStore } from "@/store/useAuthStore";

function Profile() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);

  const fullName = [authUser?.firstName, authUser?.lastName]
    .filter(Boolean)
    .join(" ");

  const statusLabel = authUser?.isOnline
    ? "Online now"
    : authUser?.lastSeen
      ? `Last seen ${formatDateTime(authUser.lastSeen)}`
      : "Offline";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/chat" className="flex items-center gap-2.5" aria-label="Back to ClickChat">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MessageCircle className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">ClickChat</span>
          </Link>

          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => navigate("/chat")}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to chats</span>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-sm font-medium text-muted-foreground">ACCOUNT</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your profile</h1>
          <p className="mt-2 text-muted-foreground">
            Your identity and account details across ClickChat.
          </p>
        </div>

        <Card className="relative overflow-hidden rounded-3xl border-0 py-0 shadow-xl shadow-primary/5 ring-1 ring-foreground/10">
          <div className="relative h-36 overflow-hidden bg-primary sm:h-44">
            <div className="absolute -right-12 -top-24 size-64 rounded-full border border-primary-foreground/10" />
            <div className="absolute -bottom-32 left-1/4 size-72 rounded-full border border-primary-foreground/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,color-mix(in_oklab,var(--primary-foreground)_12%,transparent),transparent_25%)]" />
          </div>

          <CardContent className="px-5 pb-7 sm:px-8 sm:pb-9">
            <div className="relative -mt-16 flex flex-col items-center sm:-mt-18">
              <ProfilePictureUpload />

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary" className="h-7 gap-1.5 px-3">
                  <span className={`size-2 rounded-full ${authUser?.isOnline ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                  {statusLabel}
                </Badge>
                {authUser?.isEmailVerified && (
                  <Badge variant="outline" className="h-7 gap-1.5 px-3">
                    <BadgeCheck className="size-3.5 text-emerald-500" />
                    Verified account
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <Card className="rounded-2xl py-6">
            <CardHeader>
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Quote className="size-5" />
              </div>
              <CardTitle className="text-xl tracking-tight">About you</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                {authUser?.bio || "No bio has been added yet."}
              </p>
              <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Protected profile</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Your account is secured through verified authentication and a private session.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl py-6">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Account details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileDetail icon={UserRound} label="Full name" value={fullName || "Not available"} />
                <ProfileDetail icon={Mail} label="Email address" value={authUser?.email || "Not available"} />
                <ProfileDetail icon={CalendarDays} label="Date of birth" value={formatDate(authUser?.dateOfBirth)} />
                <ProfileDetail icon={Clock3} label="Member since" value={formatDate(authUser?.createdAt)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ProfileDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-sm ring-1 ring-foreground/8">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium" title={value}>{value}</p>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default Profile;
