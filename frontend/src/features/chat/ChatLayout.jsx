import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { ChatWindow } from "./components/ChatWindow";
import { ConversationSidebar } from "./components/ConversationSidebar";
import {
  useChatBootstrap,
  useChatRealtime,
} from "./hooks/useChatRealtime";
import { toConversationListItems } from "./selectors/conversation-list";
import { useConversationStore } from "./store/useConversationStore";

export function ChatLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConversationId = searchParams.get("conversation");

  const authUser = useAuthStore((state) => state.authUser);
  const conversations = useConversationStore((state) => state.conversations);
  const isLoadingConversations = useConversationStore(
    (state) => state.isLoadingConversations,
  );

  useChatBootstrap();

  const handleRemovedConversation = useCallback(
    (conversationId) => {
      if (conversationId === selectedConversationId) {
        setSearchParams({}, { replace: true });
      }
    },
    [selectedConversationId, setSearchParams],
  );

  const { emitTyping, typingByConversation } = useChatRealtime({
    onConversationRemoved: handleRemovedConversation,
  });

  const sidebarConversations = useMemo(
    () => toConversationListItems(conversations, authUser?._id),
    [authUser?._id, conversations],
  );

  const selectedConversation = useMemo(
    () =>
      sidebarConversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) || null,
    [selectedConversationId, sidebarConversations],
  );

  const handleSelectConversation = (conversation) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("conversation", conversation.id);
      return nextParams;
    });
  };

  const handleBackToConversations = () => {
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.delete("conversation");
        return nextParams;
      },
      { replace: true },
    );
  };

  const handleOpenConversationId = (conversationId) => {
    setSearchParams({ conversation: conversationId });
  };

  return (
    <div className="h-full w-full overflow-hidden bg-muted/30">
      <main className="relative flex h-full min-h-0 gap-3 overflow-hidden md:p-3">
        <div
          className={`h-full w-full overflow-hidden bg-background md:block md:w-[320px] md:rounded-2xl md:shadow-sm md:ring-1 md:ring-foreground/10 lg:w-[340px] xl:w-[360px] ${
            selectedConversation ? "hidden" : "block"
          }`}
        >
          <ConversationSidebar
            conversations={sidebarConversations}
            isLoading={isLoadingConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            onOpenConversationId={handleOpenConversationId}
          />
        </div>

        <div
          className={`h-full min-w-0 flex-1 overflow-hidden bg-background md:block md:rounded-2xl md:shadow-sm md:ring-1 md:ring-foreground/10 ${
            selectedConversation ? "block" : "hidden"
          }`}
        >
          <ChatWindow
            selectedConversation={selectedConversation}
            onBack={handleBackToConversations}
            typingUser={
              selectedConversationId
                ? typingByConversation[selectedConversationId] || null
                : null
            }
            onTypingChange={emitTyping}
          />
        </div>
      </main>
    </div>
  );
}

