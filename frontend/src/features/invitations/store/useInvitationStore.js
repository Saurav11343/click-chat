import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/shared/api/api-client";
import { useConversationStore } from "@/features/chat/store/useConversationStore";

export const useInvitationStore = create((set, get) => ({
  isSendingInvitation: false,
  sendingToUserId: null,
  receivedInvitations: [],
  sentInvitations: [],
  isLoadingInvitations: false,
  respondingToInvitationId: null,

  addIncomingInvitation: (invitation) => {
    if (!invitation?._id) {
      return;
    }

    set((state) => {
      const alreadyExists = state.receivedInvitations.some(
        (item) => item._id === invitation._id,
      );

      if (alreadyExists) {
        return {};
      }

      return {
        receivedInvitations: [invitation, ...state.receivedInvitations],
      };
    });
  },

  applyInvitationResponse: ({ invitation, conversation }) => {
    if (!invitation?._id) {
      return;
    }

    set((state) => ({
      receivedInvitations: state.receivedInvitations.filter(
        (item) => item._id !== invitation._id,
      ),
      sentInvitations: state.sentInvitations.filter(
        (item) => item._id !== invitation._id,
      ),
    }));

    if (invitation.status === "accepted" && conversation) {
      useConversationStore.getState().addConversation(conversation);
    }
  },

  sendInvitation: async (recipientId) => {
    set({ isSendingInvitation: true, sendingToUserId: recipientId });

    try {
      const response = await axiosInstance.post("/invitations", {
        recipientId,
      });

      const invitation = response.data.invitation;

      if (invitation) {
        set((state) => ({
          sentInvitations: [
            invitation,
            ...state.sentInvitations.filter(
              (item) => item._id !== invitation._id,
            ),
          ],
        }));
      }

      toast.success(response.data.message || "Invitation sent successfully");

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to send invitation.",
      );
      return false;
    } finally {
      set({
        isSendingInvitation: false,
        sendingToUserId: null,
      });
    }
  },

  getInvitations: async () => {
    set({
      isLoadingInvitations: true,
    });

    try {
      const response = await axiosInstance.get("/invitations");

      set({
        receivedInvitations: response.data.received || [],
        sentInvitations: response.data.sent || [],
      });

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load invitations.",
      );

      return false;
    } finally {
      set({
        isLoadingInvitations: false,
      });
    }
  },
  respondToInvitation: async (invitationId, action) => {
    set({
      respondingToInvitationId: invitationId,
    });

    try {
      const response = await axiosInstance.patch(
        `/invitations/${invitationId}`,
        {
          action,
        },
      );

      toast.success(
        response.data.message || "Invitation updated successfully.",
      );

      get().applyInvitationResponse({
        invitation: response.data.invitation,
        conversation: response.data.conversation,
      });

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update invitation.",
      );

      return false;
    } finally {
      set({
        respondingToInvitationId: null,
      });
    }
  },
}));
