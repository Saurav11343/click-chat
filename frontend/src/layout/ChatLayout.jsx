"use client";

import { useState, useEffect } from "react";

import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Navbar } from "./Navbar";
import { useInvitationStore } from "@/store/useInvitationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore } from "@/store/useConversationStore";

export function ChatLayout() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  const getInvitations = useInvitationStore((state) => state.getInvitations);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

  const authUser = useAuthStore((state) => state.authUser);

  const conversations = useConversationStore((state) => state.conversations);

  const getConversations = useConversationStore(
    (state) => state.getConversations,
  );

  const isLoadingConversations = useConversationStore(
    (state) => state.isLoadingConversations,
  );

  useEffect(() => {
    getInvitations();
    getConversations();
  }, [getInvitations, getConversations]);

  const sidebarConversations = conversations.map((conversation) => {
    if (conversation.type === "group") {
      const groupName = conversation.groupName || "Unnamed group";

      return {
        id: conversation._id,
        conversationId: conversation._id,
        name: groupName,
        initials: groupName
          .split(" ")
          .map((word) => word.charAt(0))
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        image: conversation.groupImage?.url || "",
        lastMessage:
          conversation.lastMessage?.content || "Group conversation created.",
        time: "",
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
      lastMessage:
        conversation.lastMessage?.content || "Conversation created. Say hello!",
      time: "",
      unreadCount: 0,
      online: otherUser?.isOnline || false,
      lastSeen: otherUser?.lastSeen,
      isGroup: false,
    };
  });

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
