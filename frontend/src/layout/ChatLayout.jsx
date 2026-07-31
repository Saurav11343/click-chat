"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

import { useInvitationStore } from "@/store/useInvitationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore } from "@/store/useConversationStore";

import { socket } from "@/lib/socket";
import { getMessagePreview } from "@/lib/messagePreview";
import { useMessageStore } from "@/store/useMessageStore";

export function ChatLayout() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedConversationId = searchParams.get("conversation");

  const [typingByConversation, setTypingByConversation] = useState({});

  const typingTimeoutsRef = useRef(new Map());

  const authUser = useAuthStore((state) => state.authUser);

  const getInvitations = useInvitationStore((state) => state.getInvitations);

  const addIncomingInvitation = useInvitationStore(
    (state) => state.addIncomingInvitation,
  );

  const applyInvitationResponse = useInvitationStore(
    (state) => state.applyInvitationResponse,
  );

  const conversations = useConversationStore((state) => state.conversations);

  const getConversations = useConversationStore(
    (state) => state.getConversations,
  );

  const syncLastMessage = useConversationStore(
    (state) => state.syncLastMessage,
  );

  const updateParticipantPresence = useConversationStore(
    (state) => state.updateParticipantPresence,
  );

  const isLoadingConversations = useConversationStore(
    (state) => state.isLoadingConversations,
  );

  const addIncomingMessage = useMessageStore(
    (state) => state.addIncomingMessage,
  );

  const replaceMessage = useMessageStore((state) => state.replaceMessage);

  useEffect(() => {
    getInvitations();
    getConversations();
  }, [getInvitations, getConversations]);

  const handleTypingChange = useCallback((conversationId, isTyping) => {
    if (!conversationId || !socket.connected) {
      return;
    }

    socket.emit(isTyping ? "typing:start" : "typing:stop", {
      conversationId,
    });
  }, []);

  useEffect(() => {
    const typingTimeouts = typingTimeoutsRef.current;

    const handleNewMessage = (message) => {
      addIncomingMessage(message);
      syncLastMessage(message, { isNew: true });
    };

    const handleUpdatedMessage = (message) => {
      replaceMessage(message);
      syncLastMessage(message);
    };

    const handleDeletedMessage = (message) => {
      replaceMessage(message);
      syncLastMessage(message);
    };

    const handlePresenceUpdate = (presence) => {
      updateParticipantPresence(presence);
    };

    const handleNewInvitation = (invitation) => {
      addIncomingInvitation(invitation);
    };

    const handleInvitationResponse = (payload) => {
      applyInvitationResponse(payload);
    };

    const handleTypingUpdate = ({
      conversationId,
      userId,
      firstName,
      isTyping,
    }) => {
      if (!conversationId || !userId) {
        return;
      }

      const existingTimeout = typingTimeouts.get(conversationId);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.delete(conversationId);
      }

      if (!isTyping) {
        setTypingByConversation((currentTyping) => {
          const nextTyping = { ...currentTyping };

          delete nextTyping[conversationId];

          return nextTyping;
        });

        return;
      }

      setTypingByConversation((currentTyping) => ({
        ...currentTyping,
        [conversationId]: {
          userId,
          firstName: firstName || "Someone",
        },
      }));

      const safetyTimeout = setTimeout(() => {
        setTypingByConversation((currentTyping) => {
          const nextTyping = { ...currentTyping };

          delete nextTyping[conversationId];

          return nextTyping;
        });

        typingTimeouts.delete(conversationId);
      }, 3000);

      typingTimeouts.set(conversationId, safetyTimeout);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", handleUpdatedMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("invitation:new", handleNewInvitation);
    socket.on("invitation:responded", handleInvitationResponse);
    socket.on("typing:update", handleTypingUpdate);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", handleUpdatedMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("invitation:new", handleNewInvitation);
      socket.off("invitation:responded", handleInvitationResponse);
      socket.off("typing:update", handleTypingUpdate);

      for (const timeout of typingTimeouts.values()) {
        clearTimeout(timeout);
      }

      typingTimeouts.clear();
    };
  }, [
    addIncomingMessage,
    replaceMessage,
    syncLastMessage,
    updateParticipantPresence,
    addIncomingInvitation,
    applyInvitationResponse,
  ]);

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

  const sidebarConversations = conversations.map((conversation) => {
    if (conversation.type === "group") {
      const groupName = conversation.groupName || "Unnamed group";

      const initials = groupName
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

      return {
        id: conversation._id,
        conversationId: conversation._id,
        name: groupName,
        initials: initials || "G",
        image: conversation.groupImage?.url || "",
        lastMessage: getMessagePreview(
          conversation.lastMessage,
          "Group conversation created.",
        ),
        time: formatConversationTime(
          conversation.lastMessage?.createdAt || conversation.updatedAt,
        ),
        unreadCount: 0,
        online: false,
        isGroup: true,
      };
    }

    const otherUser = conversation.participants.find(
      (participant) => participant._id !== authUser?._id,
    );

    const fullName = [otherUser?.firstName, otherUser?.lastName]
      .filter(Boolean)
      .join(" ");

    const initials = `${otherUser?.firstName?.charAt(0) || ""}${
      otherUser?.lastName?.charAt(0) || ""
    }`.toUpperCase();

    return {
      id: conversation._id,
      conversationId: conversation._id,
      userId: otherUser?._id,
      name: fullName || "Unknown user",
      initials: initials || "U",
      image: otherUser?.profilePic?.url || "",
      email: otherUser?.email || "",
      bio: otherUser?.bio || "",
      lastMessage: getMessagePreview(conversation.lastMessage),
      time: formatConversationTime(
        conversation.lastMessage?.createdAt || conversation.updatedAt,
      ),
      unreadCount: 0,
      online: otherUser?.isOnline || false,
      lastSeen: otherUser?.lastSeen,
      isGroup: false,
    };
  });

  const selectedConversation =
    sidebarConversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) || null;

  return (
    <div className="h-dvh w-full overflow-hidden bg-muted/30">
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
            onTypingChange={handleTypingChange}
          />
        </div>
      </main>
    </div>
  );
}

function formatConversationTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}
