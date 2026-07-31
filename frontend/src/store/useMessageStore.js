import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";
import { useConversationStore } from "./useConversationStore";

export const useMessageStore = create((set, get) => ({
  messages: [],
  activeConversationId: null,

  isLoadingMessages: false,
  isSendingMessage: false,
  isSendingAttachment: false,
  isSendingExternalMedia: false,

  attachmentUploadProgress: 0,

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

      /*
       * Prevent an older request from replacing messages belonging to a newly
       * selected conversation.
       */
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

      useConversationStore
        .getState()
        .syncLastMessage(newMessage, { isNew: true });

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

  sendAttachment: async ({
    conversationId,
    file,
    content = "",
    replyTo = null,
  }) => {
    if (!conversationId || !file) {
      toast.error("Please select a file.");

      return false;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("content", content.trim());

    if (replyTo) {
      formData.append("replyTo", replyTo);
    }

    set({
      isSendingAttachment: true,
      attachmentUploadProgress: 0,
    });

    try {
      const response = await axiosInstance.post(
        `/conversations/${conversationId}/attachments`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) {
              return;
            }

            const percentage = Math.min(
              100,
              Math.round((progressEvent.loaded * 100) / progressEvent.total),
            );

            set({
              attachmentUploadProgress: percentage,
            });
          },
        },
      );

      const newMessage = response.data.data;

      if (get().activeConversationId === conversationId) {
        set((state) => {
          const alreadyExists = state.messages.some(
            (message) => message._id === newMessage._id,
          );

          if (alreadyExists) {
            return {};
          }

          return {
            messages: [...state.messages, newMessage],
          };
        });
      }

      useConversationStore
        .getState()
        .syncLastMessage(newMessage, { isNew: true });

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to upload the attachment.",
      );

      return false;
    } finally {
      set({
        isSendingAttachment: false,
        attachmentUploadProgress: 0,
      });
    }
  },

  sendExternalMedia: async ({ conversationId, media }) => {
    if (!conversationId || !media?.providerId) {
      return false;
    }

    set({ isSendingExternalMedia: true });

    try {
      const response = await axiosInstance.post(
        `/conversations/${conversationId}/media`,
        media,
      );
      const newMessage = response.data.data;

      if (get().activeConversationId === conversationId) {
        set((state) => ({ messages: [...state.messages, newMessage] }));
      }

      useConversationStore
        .getState()
        .syncLastMessage(newMessage, { isNew: true });

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to send GIPHY media.",
      );
      return false;
    } finally {
      set({ isSendingExternalMedia: false });
    }
  },

  addIncomingMessage: (incomingMessage) => {
    set((state) => {
      const alreadyExists = state.messages.some(
        (message) => message._id === incomingMessage._id,
      );

      const belongsToActiveConversation =
        state.activeConversationId === incomingMessage.conversation;

      if (alreadyExists || !belongsToActiveConversation) {
        return {};
      }

      return {
        messages: [...state.messages, incomingMessage],
      };
    });
  },

  replaceMessage: (incomingMessage) => {
    set((state) => {
      const belongsToActiveConversation =
        state.activeConversationId === incomingMessage.conversation;

      if (!belongsToActiveConversation) {
        return {};
      }

      const messageExists = state.messages.some(
        (message) => message._id === incomingMessage._id,
      );

      if (!messageExists) {
        return {};
      }

      return {
        messages: state.messages.map((message) =>
          message._id === incomingMessage._id
            ? {
                ...message,
                ...incomingMessage,
              }
            : message,
        ),
      };
    });
  },

  clearMessages: () => {
    set({
      messages: [],
      activeConversationId: null,
      isLoadingMessages: false,
      isSendingAttachment: false,
      isSendingExternalMedia: false,
      attachmentUploadProgress: 0,
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

      get().replaceMessage(updatedMessage);

      useConversationStore.getState().syncLastMessage(updatedMessage);

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

      get().replaceMessage(deletedMessage);

      useConversationStore.getState().syncLastMessage(deletedMessage);

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
