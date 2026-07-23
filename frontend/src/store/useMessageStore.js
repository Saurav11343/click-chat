import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";
import { useConversationStore } from "./useConversationStore";

export const useMessageStore = create((set, get) => ({
  messages: [],
  activeConversationId: null,
  isLoadingMessages: false,
  isSendingMessage: false,

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
}));
