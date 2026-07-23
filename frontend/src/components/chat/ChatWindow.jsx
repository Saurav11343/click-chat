import { useEffect, useRef } from "react";

import {
  ArrowLeft,
  EllipsisVertical,
  Phone,
  Search,
  SendHorizontal,
  Video,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { MessageComposer } from "@/components/chat/MessageComposer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageBubble } from "@/components/chat/MessageBubble";

import { useAuthStore } from "@/store/useAuthStore";
import { useMessageStore } from "@/store/useMessageStore";

export function ChatWindow({ selectedConversation, onBack }) {
  const authUser = useAuthStore((state) => state.authUser);

  const messages = useMessageStore((state) => state.messages);

  const isLoadingMessages = useMessageStore((state) => state.isLoadingMessages);

  const getMessages = useMessageStore((state) => state.getMessages);

  const clearMessages = useMessageStore((state) => state.clearMessages);

  const conversationId = selectedConversation?.conversationId;

  const messagesEndRef = useRef(null);

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
          {isLoadingMessages ? (
            <MessagesLoadingState />
          ) : messages.length === 0 ? (
            <EmptyMessagesState />
          ) : (
            <>
              <div className="my-2 flex justify-center">
                <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                  Messages
                </span>
              </div>

              {messages.map((message) => {
                const senderId =
                  typeof message.sender === "string"
                    ? message.sender
                    : message.sender?._id;

                const isMyMessage = senderId === authUser?._id;

                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isMyMessage={isMyMessage}
                    conversationId={conversationId}
                  />
                );
              })}

              <div ref={messagesEndRef} aria-hidden="true" />
            </>
          )}
        </div>
      </div>

      <Separator />

      <footer className="shrink-0 bg-background p-2 sm:p-4">
        <MessageComposer conversationId={conversationId} />
      </footer>
    </section>
  );
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
