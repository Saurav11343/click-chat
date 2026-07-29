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
    <aside className="flex h-full min-h-0 w-full flex-col bg-background">
      <div className="flex min-h-22 shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Your inbox</p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">Messages</h1>

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
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation)}
                  className={`group/conversation flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSelected
                      ? "bg-primary/8 shadow-sm ring-1 ring-primary/15"
                      : "hover:bg-muted/70 active:scale-[0.99] active:bg-muted"
                  }`}
                >
                  <div className="relative shrink-0">
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
                  </div>

                  <div className="min-w-0 flex-1">
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
