import { MessageCirclePlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function UserSearchItem({
  user,
  onInvite,
  isInviting = false,
  isPending = false,
}) {
  const profilePicUrl =
    typeof user?.profilePic === "string"
      ? user.profilePic
      : user?.profilePic?.url || "";

  const initials = `${user?.firstName?.charAt(0) || ""}${
    user?.lastName?.charAt(0) || ""
  }`.toUpperCase();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40">
      <Avatar className="size-11 shrink-0 border">
        <AvatarImage
          src={profilePicUrl}
          alt={
            fullName ? `${fullName}'s profile picture` : "User profile picture"
          }
          className="object-cover"
        />

        <AvatarFallback className="font-medium">
          {initials || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {fullName || "Unknown user"}
        </p>

        <p className="truncate text-xs text-muted-foreground sm:text-sm">
          {user?.email}
        </p>
      </div>

      <Button
        type="button"
        size="sm"
        className="shrink-0"
        onClick={() => onInvite(user)}
        disabled={isInviting || isPending}
      >
        <MessageCirclePlus className="size-4" />

        <span className="hidden sm:inline">
          {isInviting ? "Sending..." : isPending ? "Pending" : "Invite"}
        </span>
      </Button>
    </div>
  );
}
