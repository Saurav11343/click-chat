import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";
import { useConversationStore } from "./useConversationStore";

export const useMessageStore = create((set, get) => ({
  messages: [],
  activeConversationId: null,
  isLoadingMessages: false,
  isSendingMessage: false,
  editingMessageId: null,
  deletingMessageId: null,

  getMessages: async (conversationId) => {
    set({
      activeConversationId: conversationId,
      isLoadingMessages: true,
      messages: [],
    });

    try {
      const response = await axiosInstance.get(
        `/conversations/${conversationId}/messages`,
      );

      // Prevent an older request from replacing
      // messages for a newer selected conversation
      if (get().activeConversationId !== conversationId) {
        return false;
      }

      set({
        messages: response.data.messages || [],
      });

      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load messages.");

      return false;
    } finally {
      if (get().activeConversationId === conversationId) {
        set({
          isLoadingMessages: false,
        });
      }
    }
  },

  sendMessage: async (conversationId, content, replyTo = null) => {
    set({
      isSendingMessage: true,
    });

    try {
      const response = await axiosInstance.post(
        `/conversations/${conversationId}/messages`,
        {
          content,
          replyTo,
        },
      );

      const newMessage = response.data.data;

      if (get().activeConversationId === conversationId) {
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      }

      await useConversationStore.getState().getConversations();

      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send message.");

      return false;
    } finally {
      set({
        isSendingMessage: false,
      });
    }
  },

  clearMessages: () => {
    set({
      messages: [],
      activeConversationId: null,
      isLoadingMessages: false,
    });
  },

  editMessage: async (conversationId, messageId, content) => {
    set({
      editingMessageId: messageId,
    });

    try {
      const response = await axiosInstance.patch(
        `/conversations/${conversationId}/messages/${messageId}`,
        {
          content,
        },
      );

      const updatedMessage = response.data.data;

      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId
            ? {
                ...message,
                ...updatedMessage,
              }
            : message,
        ),
      }));

      await useConversationStore.getState().getConversations();

      toast.success(response.data.message || "Message edited successfully.");

      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to edit message.");

      return false;
    } finally {
      set({
        editingMessageId: null,
      });
    }
  },

  deleteMessage: async (conversationId, messageId) => {
    set({
      deletingMessageId: messageId,
    });

    try {
      const response = await axiosInstance.delete(
        `/conversations/${conversationId}/messages/${messageId}`,
      );

      const deletedMessage = response.data.data;

      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId
            ? {
                ...message,
                ...deletedMessage,
              }
            : message,
        ),
      }));

      await useConversationStore.getState().getConversations();

      toast.success(response.data.message || "Message deleted successfully.");

      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete message.");

      return false;
    } finally {
      set({
        deletingMessageId: null,
      });
    }
  },
}));
