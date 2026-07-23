import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";

export const useConversationStore = create((set) => ({
  conversations: [],
  isLoadingConversations: false,

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
