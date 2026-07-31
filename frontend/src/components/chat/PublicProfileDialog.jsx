import { Clock3, Mail, Quote, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PublicProfileDialog({ user, children }) {
  if (!user || user.isGroup) {
    return children;
  }

  const status = user.online
    ? "Online now"
    : user.lastSeen
      ? `Last seen ${formatLastSeen(user.lastSeen)}`
      : "Offline";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="h-24 bg-primary">
          <div className="h-full bg-[radial-gradient(circle_at_25%_20%,color-mix(in_oklab,var(--primary-foreground)_18%,transparent),transparent_45%)]" />
        </div>

        <div className="px-5 pb-5">
          <Avatar className="-mt-11 size-22 border-4 border-popover shadow-lg">
            <AvatarImage
              src={user.image}
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback className="text-xl">{user.initials}</AvatarFallback>
          </Avatar>

          <DialogHeader className="mt-3 text-left">
            <DialogTitle className="text-xl">{user.name}</DialogTitle>
            <DialogDescription>ClickChat profile</DialogDescription>
          </DialogHeader>

          <Badge variant="secondary" className="mt-3 gap-1.5">
            <span
              className={`size-2 rounded-full ${
                user.online ? "bg-emerald-500" : "bg-muted-foreground/50"
              }`}
            />
            {status}
          </Badge>

          <div className="mt-5 space-y-2">
            <ProfileRow
              icon={Quote}
              label="About"
              value={user.bio || "No bio added yet."}
            />
            <ProfileRow
              icon={Mail}
              label="Email"
              value={user.email || "Not available"}
            />
            <ProfileRow icon={UserRound} label="Name" value={user.name} />
            <ProfileRow icon={Clock3} label="Status" value={status} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted/45 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-foreground/8">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function formatLastSeen(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
