import { LogOut, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/store/useAuthStore";

function Chat() {
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            className="text-xl font-bold"
            onClick={() => navigate("/chat")}
          >
            CLickChat
          </button>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline">
              New Chat
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-10 rounded-full p-0"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-9 w-9 border">
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
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3 py-1">
                    <Avatar className="h-11 w-11 border">
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
                      <p className="truncate font-medium">
                        {fullName || "User"}
                      </p>

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
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={handleSettingsNavigation}
                >
                  <Settings className="mr-2 h-4 w-4" />
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
                  <LogOut className="mr-2 h-4 w-4" />

                  {isLoggingOut ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <h2 className="text-2xl font-semibold">
          Welcome, {authUser?.firstName}
        </h2>

        <p className="mt-1 text-muted-foreground">
          Select a conversation or start a new chat.
        </p>
      </main>
    </div>
  );
}

export default Chat;
