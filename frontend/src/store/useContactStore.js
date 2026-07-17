import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";

export const useContactStore = create((set) => ({
  contacts: [],
  isLoadingContacts: false,

  getContacts: async () => {
    set({
      isLoadingContacts: true,
    });

    try {
      const response = await axiosInstance.get(
        "/invitations/contacts",
      );

      set({
        contacts: response.data.contacts || [],
      });

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load contacts.",
      );

      set({
        contacts: [],
      });

      return false;
    } finally {
      set({
        isLoadingContacts: false,
      });
    }
  },
}));