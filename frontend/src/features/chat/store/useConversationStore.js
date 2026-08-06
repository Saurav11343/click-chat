import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/shared/api/api-client";

export const useConversationStore = create((set) => ({
  conversations: [],
  isLoadingConversations: false,
  isUpdatingGroup: false,
  isManagingConversation: false,

  addConversation: (conversation) => {
    if (!conversation?._id) {
      return;
    }

    set((state) => ({
      conversations: [
        conversation,
        ...state.conversations.filter(
          (item) => item._id !== conversation._id,
        ),
      ],
    }));
  },

  updateConversation: (conversation) => {
    if (!conversation?._id) return;

    set((state) => ({
      conversations: state.conversations.some(
        (item) => item._id === conversation._id,
      )
        ? state.conversations.map((item) =>
            item._id === conversation._id ? conversation : item,
          )
        : [conversation, ...state.conversations],
    }));
  },

  removeConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.filter(
        (conversation) => conversation._id !== conversationId,
      ),
    }));
  },

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

  updateParticipantPresence: ({ userId, isOnline, lastSeen }) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) => ({
        ...conversation,

        participants: conversation.participants.map((participant) =>
          participant._id === userId
            ? {
                ...participant,
                isOnline,
                lastSeen,
              }
            : participant,
        ),
      })),
    }));
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

  clearDirectConversation: async (conversationId) => {
    set({ isManagingConversation: true });
    try {
      const response = await axiosInstance.post(
        `/conversations/${conversationId}/clear`,
      );
      const conversation = response.data.conversation;
      set((state) => ({
        conversations: state.conversations.map((item) =>
          item._id === conversationId ? conversation : item,
        ),
      }));
      toast.success(response.data.message || "Chat cleared.");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to clear the chat.");
      return false;
    } finally {
      set({ isManagingConversation: false });
    }
  },

  deleteDirectConversation: async (conversationId) => {
    set({ isManagingConversation: true });
    try {
      const response = await axiosInstance.delete(
        `/conversations/${conversationId}/direct`,
      );
      set((state) => ({
        conversations: state.conversations.filter(
          (item) => item._id !== conversationId,
        ),
      }));
      toast.success(response.data.message || "Conversation deleted.");
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to delete the conversation.",
      );
      return false;
    } finally {
      set({ isManagingConversation: false });
    }
  },

  createGroup: async ({ groupName, participantIds }) => {
    set({ isUpdatingGroup: true });
    try {
      const response = await axiosInstance.post("/conversations/groups", {
        groupName,
        participantIds,
      });
      const conversation = response.data.conversation;
      set((state) => ({
        conversations: [
          conversation,
          ...state.conversations.filter((item) => item._id !== conversation._id),
        ],
      }));
      toast.success(response.data.message || "Group created successfully.");
      return conversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create the group.");
      return null;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  updateGroup: async (conversationId, updates) => {
    set({ isUpdatingGroup: true });
    try {
      const response = await axiosInstance.patch(
        `/conversations/${conversationId}/group`,
        updates,
      );
      const conversation = response.data.conversation;
      set((state) => ({
        conversations: state.conversations.map((item) =>
          item._id === conversationId ? conversation : item,
        ),
      }));
      toast.success(response.data.message || "Group updated.");
      return conversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update the group.");
      return null;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  updateGroupImage: async (conversationId, file) => {
    set({ isUpdatingGroup: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.patch(
        `/conversations/${conversationId}/group/image`,
        formData,
      );
      const conversation = response.data.conversation;
      set((state) => ({
        conversations: state.conversations.map((item) =>
          item._id === conversationId ? conversation : item,
        ),
      }));
      toast.success(response.data.message || "Group image updated.");
      return conversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update the group image.");
      return null;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  addGroupParticipants: async (conversationId, participantIds) => {
    set({ isUpdatingGroup: true });
    try {
      const response = await axiosInstance.post(
        `/conversations/${conversationId}/group/participants`,
        { participantIds },
      );
      const conversation = response.data.conversation;
      set((state) => ({
        conversations: state.conversations.map((item) =>
          item._id === conversationId ? conversation : item,
        ),
      }));
      toast.success(response.data.message || "Members added.");
      return conversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add members.");
      return null;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  removeGroupParticipant: async (conversationId, participantId) => {
    set({ isUpdatingGroup: true });
    try {
      const response = await axiosInstance.delete(
        `/conversations/${conversationId}/group/participants/${participantId}`,
      );
      const conversation = response.data.conversation;
      set((state) => ({
        conversations: state.conversations.map((item) =>
          item._id === conversationId ? conversation : item,
        ),
      }));
      toast.success(response.data.message || "Member removed.");
      return conversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove the member.");
      return null;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  updateGroupAdmin: async (conversationId, participantId, action) => {
    set({ isUpdatingGroup: true });
    try {
      const response = await axiosInstance.patch(
        `/conversations/${conversationId}/group/admins/${participantId}`,
        { action },
      );
      const conversation = response.data.conversation;
      set((state) => ({
        conversations: state.conversations.map((item) =>
          item._id === conversationId ? conversation : item,
        ),
      }));
      toast.success(response.data.message || "Administrators updated.");
      return conversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update administrators.");
      return null;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  leaveGroup: async (conversationId) => {
    set({ isUpdatingGroup: true });
    try {
      const response = await axiosInstance.post(
        `/conversations/${conversationId}/group/leave`,
      );
      set((state) => ({
        conversations: state.conversations.filter(
          (item) => item._id !== conversationId,
        ),
      }));
      toast.success(response.data.message || "You left the group.");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to leave the group.");
      return false;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  deleteGroup: async (conversationId) => {
    set({ isUpdatingGroup: true });
    try {
      const response = await axiosInstance.delete(
        `/conversations/${conversationId}/group`,
      );
      set((state) => ({
        conversations: state.conversations.filter(
          (item) => item._id !== conversationId,
        ),
      }));
      toast.success(response.data.message || "Group deleted.");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete the group.");
      return false;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },
}));
