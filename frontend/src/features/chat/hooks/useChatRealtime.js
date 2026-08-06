import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useInvitationStore } from "@/features/invitations/store/useInvitationStore";
import { socket } from "@/shared/realtime/socket-client";
import { useConversationStore } from "../store/useConversationStore";
import { useMessageStore } from "../store/useMessageStore";

const TYPING_SAFETY_TIMEOUT_MS = 3000;

export function useChatRealtime({ onConversationRemoved }) {
  const [typingByConversation, setTypingByConversation] = useState({});
  const typingTimeoutsRef = useRef(new Map());

  const addIncomingInvitation = useInvitationStore(
    (state) => state.addIncomingInvitation,
  );
  const applyInvitationResponse = useInvitationStore(
    (state) => state.applyInvitationResponse,
  );
  const syncLastMessage = useConversationStore(
    (state) => state.syncLastMessage,
  );
  const updateConversation = useConversationStore(
    (state) => state.updateConversation,
  );
  const removeConversation = useConversationStore(
    (state) => state.removeConversation,
  );
  const updateParticipantPresence = useConversationStore(
    (state) => state.updateParticipantPresence,
  );
  const applyUnreadCount = useConversationStore(
    (state) => state.applyUnreadCount,
  );
  const markConversationRead = useConversationStore(
    (state) => state.markConversationRead,
  );
  const markConversationDelivered = useConversationStore(
    (state) => state.markConversationDelivered,
  );
  const addIncomingMessage = useMessageStore(
    (state) => state.addIncomingMessage,
  );
  const replaceMessage = useMessageStore((state) => state.replaceMessage);
  const handleConversationCleared = useMessageStore(
    (state) => state.handleConversationCleared,
  );

  const emitTyping = useCallback((conversationId, isTyping) => {
    if (!conversationId || !socket.connected) return;

    socket.emit(isTyping ? "typing:start" : "typing:stop", {
      conversationId,
    });
  }, []);

  useEffect(() => {
    const typingTimeouts = typingTimeoutsRef.current;

    const handleNewMessage = (message) => {
      addIncomingMessage(message);
      syncLastMessage(message, { isNew: true });
      void markConversationDelivered(message.conversation);
      if (
        useMessageStore.getState().activeConversationId === message.conversation &&
        document.visibilityState === "visible" &&
        document.hasFocus()
      ) {
        void markConversationRead(message.conversation);
      }
    };
    const handleMessageChanged = (message) => {
      replaceMessage(message);
      syncLastMessage(message);
    };
    const handleTypingUpdate = ({
      conversationId,
      userId,
      firstName,
      isTyping,
    }) => {
      if (!conversationId || !userId) return;

      const existingTimeout = typingTimeouts.get(conversationId);
      if (existingTimeout) clearTimeout(existingTimeout);
      typingTimeouts.delete(conversationId);

      if (!isTyping) {
        setTypingByConversation((current) => {
          const next = { ...current };
          delete next[conversationId];
          return next;
        });
        return;
      }

      setTypingByConversation((current) => ({
        ...current,
        [conversationId]: { userId, firstName: firstName || "Someone" },
      }));

      const timeout = setTimeout(() => {
        setTypingByConversation((current) => {
          const next = { ...current };
          delete next[conversationId];
          return next;
        });
        typingTimeouts.delete(conversationId);
      }, TYPING_SAFETY_TIMEOUT_MS);

      typingTimeouts.set(conversationId, timeout);
    };
    const handleConversationRemoved = ({ conversationId }) => {
      removeConversation(conversationId);
      onConversationRemoved?.(conversationId);
    };

    const listeners = [
      ["message:new", handleNewMessage],
      ["message:updated", handleMessageChanged],
      ["message:deleted", handleMessageChanged],
      ["message:reaction", replaceMessage],
      ["presence:update", updateParticipantPresence],
      ["invitation:new", addIncomingInvitation],
      ["invitation:responded", applyInvitationResponse],
      ["typing:update", handleTypingUpdate],
      ["conversation:created", updateConversation],
      ["conversation:updated", updateConversation],
      ["conversation:removed", handleConversationRemoved],
      ["conversation:unread", applyUnreadCount],
      ["message:receipts", useMessageStore.getState().applyMessageReceipts],
      ["messages:cleared", ({ conversationId }) =>
        handleConversationCleared(conversationId)],
    ];

    for (const [event, handler] of listeners) socket.on(event, handler);

    return () => {
      for (const [event, handler] of listeners) socket.off(event, handler);
      for (const timeout of typingTimeouts.values()) clearTimeout(timeout);
      typingTimeouts.clear();
    };
  }, [
    addIncomingInvitation,
    applyUnreadCount,
    addIncomingMessage,
    applyInvitationResponse,
    handleConversationCleared,
    markConversationRead,
    markConversationDelivered,
    onConversationRemoved,
    removeConversation,
    replaceMessage,
    syncLastMessage,
    updateConversation,
    updateParticipantPresence,
  ]);

  return { emitTyping, typingByConversation };
}

export function useChatBootstrap() {
  const authUser = useAuthStore((state) => state.authUser);
  const getInvitations = useInvitationStore((state) => state.getInvitations);
  const getConversations = useConversationStore(
    (state) => state.getConversations,
  );

  useEffect(() => {
    getInvitations();
    getConversations();
  }, [authUser?._id, getConversations, getInvitations]);
}

