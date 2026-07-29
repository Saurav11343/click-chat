"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  MessageCircleMore,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/store/useAuthStore";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ModeToggle } from "@/components/ui/ModeToggle";

export function Navbar() {
  const navigate = useNavigate();

  const authUser = useAuthStore((state) => state.authUser);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  const profilePicUrl =
    typeof authUser?.profilePic === "string"
      ? authUser.profilePic
      : authUser?.profilePic?.url || "";

  const initials = `${authUser?.firstName?.charAt(0) || ""}${
    authUser?.lastName?.charAt(0) || ""
  }`.toUpperCase();

  const fullName = [authUser?.firstName, authUser?.lastName]
    .filter(Boolean)
    .join(" ");

  const handleLogout = async () => {
    const success = await logout();

    if (success) {
      navigate("/", {
        replace: true,
      });
    }
  };

  const handleProfileNavigation = () => {
    navigate("/profile");
  };

  const handleSettingsNavigation = () => {
    navigate("/settings");
  };

  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/90 px-3 shadow-sm backdrop-blur-xl sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-4 lg:gap-8">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <MessageCircleMore className="size-5" />
          </div>

          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-base font-semibold leading-none sm:text-lg">
              ClickChat
            </p>

            <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
              Real-time messaging
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-1 rounded-xl bg-muted/65 p-1 ring-1 ring-foreground/5 md:flex">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 rounded-lg bg-background px-3 shadow-sm hover:bg-background"
          >
            <MessageCircleMore className="size-4" />
            Chats
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg px-3"
          >
            <UsersRound className="size-4" />
            Groups
          </Button>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ModeToggle />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-11 gap-2 rounded-xl border border-transparent px-1.5 py-1.5 hover:border-border hover:bg-muted/60 sm:px-2.5"
              aria-label="Open user menu"
            >
              <Avatar className="size-9 overflow-hidden border">
                <AvatarImage
                  src={profilePicUrl}
                  alt={
                    fullName
                      ? `${fullName}'s profile picture`
                      : "User profile picture"
                  }
                  className="object-cover"
                />

                <AvatarFallback className="font-medium">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="hidden max-w-36 text-left lg:block">
                <p className="truncate text-sm font-medium">
                  {fullName || "User"}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {authUser?.email || "Signed in"}
                </p>
              </div>

              <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-2xl p-2 shadow-xl"
          >
            <DropdownMenuLabel className="rounded-xl bg-muted/45 p-3 font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 overflow-hidden border">
                  <AvatarImage
                    src={profilePicUrl}
                    alt={
                      fullName
                        ? `${fullName}'s profile picture`
                        : "User profile picture"
                    }
                    className="object-cover"
                  />

                  <AvatarFallback className="font-medium">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate font-medium">{fullName || "User"}</p>

                  <p className="truncate text-xs text-muted-foreground">
                    {authUser?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onSelect={handleProfileNavigation}
            >
              <UserRound className="size-4" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onSelect={handleSettingsNavigation}
            >
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
              disabled={isLoggingOut}
              onSelect={(event) => {
                event.preventDefault();
                handleLogout();
              }}
            >
              <LogOut className="size-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
