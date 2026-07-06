import { LogOut, User, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/store/useAuthStore";

function Chat() {
  const { authUser, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold">RealTime Chat</h1>

          <div className="flex items-center gap-4">
            <Button variant="outline">New Chat</Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback>
                    {authUser?.firstName?.charAt(0)}
                    {authUser?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="font-medium">
                    {authUser?.firstName} {authUser?.lastName}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {authUser?.email}
                  </p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="p-6">
        <h2 className="text-2xl font-semibold">
          Welcome, {authUser?.firstName}
        </h2>
      </main>
    </div>
  );
}

export default Chat;
