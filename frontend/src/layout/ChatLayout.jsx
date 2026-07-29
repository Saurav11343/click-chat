"use client";

import { useEffect, useState } from "react";

import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Navbar } from "./Navbar";

import { useInvitationStore } from "@/store/useInvitationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore } from "@/store/useConversationStore";

import { socket } from "@/lib/socket";
import { useMessageStore } from "@/store/useMessageStore";

export function ChatLayout() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);

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

  useEffect(() => {
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

    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", handleUpdatedMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("invitation:new", handleNewInvitation);
    socket.on("invitation:responded", handleInvitationResponse);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", handleUpdatedMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("invitation:new", handleNewInvitation);
      socket.off("invitation:responded", handleInvitationResponse);
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
    setSelectedConversationId(conversation.id);
  };

  const handleBackToConversations = () => {
    setSelectedConversationId(null);
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
        lastMessage: conversation.lastMessage?.isDeleted
          ? "Message deleted"
          : conversation.lastMessage?.content || "Group conversation created.",
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
      lastMessage: conversation.lastMessage?.isDeleted
        ? "Message deleted"
        : conversation.lastMessage?.content ||
          "Conversation created. Say hello!",
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
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background">
      <Navbar />

      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`h-full w-full md:block md:w-[340px] lg:w-[360px] xl:w-[380px] ${
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
          className={`h-full min-w-0 flex-1 md:block ${
            selectedConversation ? "block" : "hidden"
          }`}
        >
          <ChatWindow
            selectedConversation={selectedConversation}
            onBack={handleBackToConversations}
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
