"use client";

import {
  ArrowLeft,
  EllipsisVertical,
  Phone,
  Search,
  SendHorizontal,
  Video,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const messages = [
  {
    id: "1",
    content: "Hello Saurav! How are you?",
    time: "10:28 AM",
    sender: "other",
  },
  {
    id: "2",
    content: "Hi Rahul, I am doing well. How about you?",
    time: "10:29 AM",
    sender: "me",
  },
  {
    id: "3",
    content: "I am also doing well. Are we meeting today?",
    time: "10:30 AM",
    sender: "other",
  },
];

export function ChatWindow({ selectedConversation, onBack }) {
  if (!selectedConversation) {
    return <EmptyChat />;
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-muted/20">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-2 bg-background px-2 sm:px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <Avatar className="size-9 shrink-0 sm:size-10">
            <AvatarImage
              src={selectedConversation.image}
              alt={selectedConversation.name}
              className="object-cover"
            />

            <AvatarFallback>{selectedConversation.initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold sm:text-base">
              {selectedConversation.name}
            </h2>

            <div className="flex items-center gap-1.5">
              {selectedConversation.online && !selectedConversation.isGroup && (
                <span className="size-2 shrink-0 rounded-full bg-green-500" />
              )}

              <p className="truncate text-xs text-muted-foreground">
                {selectedConversation.isGroup
                  ? "Group conversation"
                  : selectedConversation.online
                    ? "Online"
                    : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Search messages"
            className="hidden sm:inline-flex"
          >
            <Search className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Start audio call"
            className="hidden sm:inline-flex"
          >
            <Phone className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Start video call"
            className="hidden md:inline-flex"
          >
            <Video className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Conversation options"
          >
            <EllipsisVertical className="size-5" />
          </Button>
        </div>
      </header>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end gap-3">
          <div className="my-2 flex justify-center">
            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              Today
            </span>
          </div>

          {messages.map((message) => {
            const isMyMessage = message.sender === "me";

            return (
              <div
                key={message.id}
                className={`flex ${
                  isMyMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2.5 sm:max-w-[70%] sm:px-4 ${
                    isMyMessage
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border bg-background"
                  }`}
                >
                  <p className="break-words text-sm leading-relaxed">
                    {message.content}
                  </p>

                  <p
                    className={`mt-1 text-right text-[10px] sm:text-[11px] ${
                      isMyMessage
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <footer className="shrink-0 bg-background p-2 sm:p-4">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl border bg-muted/30 px-3 sm:px-4">
            <p className="truncate text-sm text-muted-foreground">
              Message composer will be added in Phase 3
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            disabled
            className="shrink-0"
            aria-label="Send message"
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}

function EmptyChat() {
  return (
    <section className="hidden h-full min-h-0 min-w-0 items-center justify-center bg-muted/20 p-6 md:flex">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SendHorizontal className="size-8" />
        </div>

        <h2 className="mt-5 text-2xl font-semibold">Welcome to ClickChat</h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Select a conversation from the sidebar to start chatting with your
          friends and groups.
        </p>
      </div>
    </section>
  );
}
