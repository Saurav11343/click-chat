import { Fragment, useEffect, useRef } from "react";

import {
  ArrowLeft,
  EllipsisVertical,
  SendHorizontal,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { MessageComposer } from "@/components/chat/MessageComposer";
import { PublicProfileDialog } from "@/components/chat/PublicProfileDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageBubble } from "@/components/chat/MessageBubble";

import { useAuthStore } from "@/store/useAuthStore";
import { useMessageStore } from "@/store/useMessageStore";

export function ChatWindow({
  selectedConversation,
  onBack,
  typingUser,
  onTypingChange,
}) {
  const authUser = useAuthStore((state) => state.authUser);

  const messages = useMessageStore((state) => state.messages);

  const isLoadingMessages = useMessageStore((state) => state.isLoadingMessages);

  const getMessages = useMessageStore((state) => state.getMessages);

  const clearMessages = useMessageStore((state) => state.clearMessages);

  const conversationId = selectedConversation?.conversationId;

  const isTyping = Boolean(typingUser);

  const conversationStatus = selectedConversation?.isGroup
    ? isTyping
      ? `${typingUser.firstName} is typing…`
      : "Group conversation"
    : isTyping
      ? `${typingUser.firstName} is typing…`
      : selectedConversation?.online
        ? "Online"
        : formatLastSeen(selectedConversation?.lastSeen);

  const messagesEndRef = useRef(null);

  const handleLatestMediaLoad = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  };

  // Load messages whenever the selected
  // conversation changes.
  useEffect(() => {
    if (conversationId) {
      getMessages(conversationId);
    } else {
      clearMessages();
    }
  }, [conversationId, getMessages, clearMessages]);

  // Scroll to the newest message after loading
  // or sending a message.
  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isLoadingMessages]);

  if (!selectedConversation) {
    return <EmptyChat />;
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-muted/25">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 bg-background/95 px-2 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 rounded-xl md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <PublicProfileDialog user={selectedConversation}>
            <button
              type="button"
              disabled={selectedConversation.isGroup}
              className="relative shrink-0 rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:scale-100"
              aria-label={`View ${selectedConversation.name}'s profile`}
            >
              <Avatar className="size-9 ring-2 ring-background sm:size-10">
                <AvatarImage
                  src={selectedConversation.image}
                  alt={selectedConversation.name}
                  className="object-cover"
                />

                <AvatarFallback>{selectedConversation.initials}</AvatarFallback>
              </Avatar>
              {selectedConversation.online &&
                !selectedConversation.isGroup && (
                  <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-[3px] border-background bg-emerald-500" />
                )}
            </button>
          </PublicProfileDialog>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight sm:text-base">
              {selectedConversation.name}
            </h2>

            <div className="flex items-center gap-1.5">
              {isTyping && (
                <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
              )}

              <p
                className={`truncate text-xs ${
                  isTyping
                    ? "font-medium text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {conversationStatus}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Conversation options"
          >
            <EllipsisVertical className="size-5" />
          </Button>
        </div>
      </header>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_4%,transparent),transparent_35%)] px-3 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-end gap-2.5">
          {isLoadingMessages ? (
            <MessagesLoadingState />
          ) : messages.length === 0 ? (
            <EmptyMessagesState />
          ) : (
            <>
              {messages.map((message, index) => {
                const senderId =
                  typeof message.sender === "string"
                    ? message.sender
                    : message.sender?._id;

                const isMyMessage = senderId === authUser?._id;
                const previousMessage = messages[index - 1];
                const showDateSeparator =
                  !previousMessage ||
                  !isSameDay(previousMessage.createdAt, message.createdAt);

                return (
                  <Fragment key={message._id}>
                    {showDateSeparator && (
                      <div className="my-3 flex items-center gap-3">
                        <span className="h-px flex-1 bg-border/70" />
                        <span className="rounded-full border bg-background/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                          {formatMessageDate(message.createdAt)}
                        </span>
                        <span className="h-px flex-1 bg-border/70" />
                      </div>
                    )}

                    <MessageBubble
                      message={message}
                      isMyMessage={isMyMessage}
                      conversationId={conversationId}
                      onMediaLoad={
                        index === messages.length - 1
                          ? handleLatestMediaLoad
                          : undefined
                      }
                    />
                  </Fragment>
                );
              })}

              <div ref={messagesEndRef} aria-hidden="true" />
            </>
          )}
        </div>
      </div>

      <Separator />

      <footer className="shrink-0 bg-background/95 p-2.5 backdrop-blur-xl sm:p-4">
        <MessageComposer
          key={conversationId}
          conversationId={conversationId}
          onTypingChange={onTypingChange}
        />
      </footer>
    </section>
  );
}

function isSameDay(firstValue, secondValue) {
  const firstDate = new Date(firstValue);
  const secondDate = new Date(secondValue);

  if (Number.isNaN(firstDate.getTime()) || Number.isNaN(secondDate.getTime())) {
    return false;
  }

  return firstDate.toDateString() === secondDate.toDateString();
}

function formatMessageDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const today = new Date();
  const yesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function formatLastSeen(value) {
  if (!value) {
    return "Offline";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Offline";
  }

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Last seen today at ${formattedTime}`;
  }

  const formattedDate = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return `Last seen ${formattedDate} at ${formattedTime}`;
}
function MessagesLoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <p className="text-sm text-muted-foreground">Loading messages...</p>
    </div>
  );
}

function EmptyMessagesState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <SendHorizontal className="size-7" />
      </div>

      <h3 className="mt-4 font-medium">No messages yet</h3>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Send the first message to start this conversation.
      </p>
    </div>
  );
}

function EmptyChat() {
  return (
    <section className="relative hidden h-full min-h-0 min-w-0 items-center justify-center overflow-hidden bg-muted/25 p-6 md:flex">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_7%,transparent),transparent_38%)]" />
      <div className="relative max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/15">
          <SendHorizontal className="size-8" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight">
          Your conversations, one click away
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Choose a conversation from the sidebar and pick up exactly where you
          left off.
        </p>
      </div>
    </section>
  );
}
