"use client";

import { useState, useEffect } from "react";

import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Navbar } from "./Navbar";
import { useInvitationStore } from "@/store/useInvitationStore";
import { useContactStore } from "@/store/useContactStore";

export function ChatLayout() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  const getInvitations = useInvitationStore((state) => state.getInvitations);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

  const contacts = useContactStore((state) => state.contacts);

  const getContacts = useContactStore((state) => state.getContacts);

  const isLoadingContacts = useContactStore((state) => state.isLoadingContacts);

  useEffect(() => {
    getInvitations();
    getContacts();
  }, [getInvitations, getContacts]);

  const contactConversations = contacts.map((contact) => {
    const fullName = [contact.firstName, contact.lastName]
      .filter(Boolean)
      .join(" ");

    const initials = `${
      contact.firstName?.charAt(0) || ""
    }${contact.lastName?.charAt(0) || ""}`.toUpperCase();

    return {
      id: contact._id,
      userId: contact._id,
      name: fullName || "Unknown user",
      initials: initials || "U",
      image: contact.profilePic?.url || "",
      lastMessage: contact.bio || "You are now connected.",
      time: "",
      unreadCount: 0,
      online: contact.isOnline || false,
      lastSeen: contact.lastSeen,
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
            conversations={contactConversations}
            isLoading={isLoadingContacts}
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
