import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";
import { useContactStore } from "./useContactStore";

export const useInvitationStore = create((set, get) => ({
  isSendingInvitation: false,
  sendingToUserId: null,
  receivedInvitations: [],
  sentInvitations: [],
  isLoadingInvitations: false,
  respondingToInvitationId: null,

  sendInvitation: async (recipientId) => {
    set({ isSendingInvitation: true, sendingToUserId: recipientId });

    try {
      const response = await axiosInstance.post("/invitations", {
        recipientId,
      });

      toast.success(response.data.message || "Invitation sent successfully");
      await get().getInvitations();

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

      await get().getInvitations();

      if (action === "accepted") {
        await useContactStore.getState().getContacts();
      }

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
