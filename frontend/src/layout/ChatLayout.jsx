"use client";

import { useState, useEffect } from "react";

import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Navbar } from "./Navbar";
import { useInvitationStore } from "@/store/useInvitationStore";

const conversations = [
  {
    id: "1",
    name: "Rahul Sharma",
    initials: "RS",
    image: "",
    lastMessage: "Are we meeting today?",
    time: "10:30 AM",
    unreadCount: 2,
    online: true,
  },
  {
    id: "2",
    name: "Priya Patel",
    initials: "PP",
    image: "",
    lastMessage: "Thank you for helping me.",
    time: "9:45 AM",
    unreadCount: 0,
    online: false,
  },
  {
    id: "3",
    name: "MCA Project Group",
    initials: "MG",
    image: "",
    lastMessage: "Aman shared a document.",
    time: "8:20 AM",
    unreadCount: 4,
    online: false,
    isGroup: true,
  },
  {
    id: "4",
    name: "John Mathew",
    initials: "JM",
    image: "",
    lastMessage: "Okay, the work is completed.",
    time: "Yesterday",
    unreadCount: 0,
    online: true,
  },
  {
    id: "5",
    name: "Anjali Verma",
    initials: "AV",
    image: "",
    lastMessage: "See you tomorrow!",
    time: "Monday",
    unreadCount: 0,
    online: false,
  },
];

export function ChatLayout() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  const getInvitations = useInvitationStore((state) => state.getInvitations);

  useEffect(() => {
    getInvitations();
  }, [getInvitations]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

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
            conversations={conversations}
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
