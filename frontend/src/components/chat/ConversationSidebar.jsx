"use client";

import { MessageSquarePlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NewChatDialog } from "./NewChatDialog";
import { InvitationsDialog } from "./InvitationsDialog";

export function ConversationSidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading = false,
}) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-background md:border-r">
      <div className="flex min-h-20 shrink-0 items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">Conversations</h1>

          <p className="truncate text-sm text-muted-foreground">
            Your recent messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InvitationsDialog />

          <NewChatDialog>
            <Button
              type="button"
              size="icon"
              aria-label="Start a new conversation"
              className="shrink-0"
            >
              <MessageSquarePlus className="size-4" />
            </Button>
          </NewChatDialog>
        </div>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {isLoading ? (
            <ContactsLoadingState />
          ) : conversations.length === 0 ? (
            <EmptyContactsState />
          ) : (
            conversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSelected
                      ? "bg-muted"
                      : "hover:bg-muted/60 active:bg-muted"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-11 sm:size-12">
                      <AvatarImage
                        src={conversation.image}
                        alt={conversation.name}
                        className="object-cover"
                      />

                      <AvatarFallback>{conversation.initials}</AvatarFallback>
                    </Avatar>

                    {conversation.online && !conversation.isGroup && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium sm:text-[15px]">
                        {conversation.name}
                      </p>

                      <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
                        {conversation.time}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
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
                  </div>
                </button>
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
          className="flex animate-pulse items-center gap-3 rounded-xl p-3"
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
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <MessageSquarePlus className="size-7 text-muted-foreground" />
      </div>

      <h3 className="mt-4 font-medium">No contacts yet</h3>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Search for a user and send an invitation to start connecting.
      </p>
    </div>
  );
}
