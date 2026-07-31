"use client";

import {
  LogOut,
  MessageCircleMore,
  MessageSquarePlus,
  Settings,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";
import { NewChatDialog } from "./NewChatDialog";
import { InvitationsDialog } from "./InvitationsDialog";
import { PublicProfileDialog } from "./PublicProfileDialog";

export function ConversationSidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading = false,
}) {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  const fullName = [authUser?.firstName, authUser?.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = `${authUser?.firstName?.charAt(0) || ""}${
    authUser?.lastName?.charAt(0) || ""
  }`.toUpperCase();
  const profilePicUrl =
    typeof authUser?.profilePic === "string"
      ? authUser.profilePic
      : authUser?.profilePic?.url || "";

  const handleLogout = async () => {
    if (await logout()) {
      navigate("/", { replace: true });
    }
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-3 sm:px-4">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <MessageCircleMore className="size-5" />
          </span>
          <span className="truncate text-base font-semibold tracking-tight">
            ClickChat
          </span>
        </button>

        <div className="flex items-center gap-1">
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl"
                aria-label="Open account menu"
              >
                <Avatar className="size-8 border">
                  <AvatarImage
                    src={profilePicUrl}
                    alt={fullName || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-60 rounded-xl p-2"
            >
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">
                  {fullName || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {authUser?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/profile")}>
                <UserRound className="size-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/settings")}>
                <Settings className="size-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isLoggingOut}
                className="text-destructive focus:text-destructive"
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
      </div>

      <div className="flex h-17 shrink-0 items-center justify-between gap-3 px-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            Messages
          </h1>
          <p className="sr-only">Your recent conversations</p>
        </div>
        <div className="flex items-center gap-2">
          <InvitationsDialog />

          <NewChatDialog>
            <Button
              type="button"
              size="icon"
              aria-label="Start a new conversation"
              className="shrink-0 rounded-xl"
            >
              <MessageSquarePlus className="size-4" />
            </Button>
          </NewChatDialog>
        </div>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1.5 p-3">
          {isLoading ? (
            <ContactsLoadingState />
          ) : conversations.length === 0 ? (
            <EmptyContactsState />
          ) : (
            conversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={`group/conversation flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSelected
                      ? "bg-primary/8 shadow-sm ring-1 ring-primary/15"
                      : "hover:bg-muted/70"
                  }`}
                >
                  <PublicProfileDialog user={conversation}>
                    <button
                      type="button"
                      onClick={
                        conversation.isGroup
                          ? () => onSelectConversation(conversation)
                          : undefined
                      }
                      className="relative shrink-0 rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={
                        conversation.isGroup
                          ? `Open ${conversation.name}`
                          : `View ${conversation.name}'s profile`
                      }
                    >
                      <Avatar className="size-11 ring-2 ring-background sm:size-12">
                        <AvatarImage
                          src={conversation.image}
                          alt={conversation.name}
                          className="object-cover"
                        />

                        <AvatarFallback>{conversation.initials}</AvatarFallback>
                      </Avatar>

                      {conversation.online && !conversation.isGroup && (
                        <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-[3px] border-background bg-emerald-500" />
                      )}
                    </button>
                  </PublicProfileDialog>

                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation)}
                    className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open conversation with ${conversation.name}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold sm:text-[15px]">
                        {conversation.name}
                      </p>

                      <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
                        {conversation.time}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          conversation.unreadCount > 0
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {conversation.lastMessage}
                      </p>

                      {conversation.unreadCount > 0 && (
                        <Badge className="min-w-5 shrink-0 justify-center rounded-full px-1.5">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

function ContactsLoadingState() {
  return (
    <div className="space-y-2 p-1">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-center gap-3 rounded-2xl p-3"
        >
          <div className="size-12 shrink-0 rounded-full bg-muted" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-44 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyContactsState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
        <MessageSquarePlus className="size-7" />
      </div>

      <h3 className="mt-4 font-medium">No contacts yet</h3>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Search for a user and send an invitation to start connecting.
      </p>
    </div>
  );
}
