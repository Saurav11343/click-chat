import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";

export const useConversationStore = create((set) => ({
  conversations: [],
  isLoadingConversations: false,

  syncLastMessage: (message, { isNew = false } = {}) => {
    set((state) => {
      const conversationIndex = state.conversations.findIndex(
        (conversation) => conversation._id === message.conversation,
      );

      if (conversationIndex === -1) {
        return {};
      }

      const conversation = state.conversations[conversationIndex];

      if (!isNew && conversation.lastMessage?._id !== message._id) {
        return {};
      }

      const updatedConversation = {
        ...conversation,
        lastMessage: {
          ...conversation.lastMessage,
          ...message,
        },
      };

      if (isNew) {
        return {
          conversations: [
            updatedConversation,
            ...state.conversations.filter(
              (item) => item._id !== conversation._id,
            ),
          ],
        };
      }

      return {
        conversations: state.conversations.map((item) =>
          item._id === conversation._id ? updatedConversation : item,
        ),
      };
    });
  },

  getConversations: async () => {
    set({ isLoadingConversations: true });

    try {
      const response = await axiosInstance.get("/conversations");

      set({ conversations: response.data.conversations || [] });

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load conversations.",
      );

      set({ conversations: [] });

      return false;
    } finally {
      set({ isLoadingConversations: false });
    }
  },
}));
