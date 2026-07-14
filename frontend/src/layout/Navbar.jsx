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
import ThemeToggle from "@/components/ui/ThemeToggle";

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
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-4 lg:gap-8">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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

        <nav className="hidden items-center gap-1 md:flex">
          <Button type="button" variant="secondary" size="sm">
            <MessageCircleMore className="size-4" />
            Chats
          </Button>

        

          <Button type="button" variant="ghost" size="sm">
            <UsersRound className="size-4" />
            Groups
          </Button>
            <ThemeToggle />
        </nav>
      </div>
        

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto gap-2 px-1.5 py-1.5 sm:px-2"
              aria-label="Open user menu"
            >
              <Avatar className="size-9 border">
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

          <DropdownMenuContent align="end" sideOffset={8} className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3 py-1">
                <Avatar className="size-11 border">
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

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={handleProfileNavigation}
            >
              <UserRound className="size-4" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={handleSettingsNavigation}
            >
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
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
