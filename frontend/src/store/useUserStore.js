import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";
import { useAuthStore } from "./useAuthStore";

export const useUserStore = create((set) => ({
  isUpdatingProfilePic: false,
  isUpdatingProfile: false,

  updateProfile: async (updates, { silent = false } = {}) => {
    set({ isUpdatingProfile: true });

    try {
      const response = await axiosInstance.patch("/user/profile", updates);

      if (response.data.success) {
        useAuthStore.setState({ authUser: response.data.user });
        if (!silent) {
          toast.success(response.data.message || "Profile updated successfully");
        }
        return true;
      }

      toast.error(response.data.message || "Profile update failed");
      return false;
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;

      toast.error(
        firstError ||
          error.response?.data?.message ||
          "Unable to update profile",
      );
      return false;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updateProfilePic: async (file) => {
    set({ isUpdatingProfilePic: true });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosInstance.patch("/user/profilePic", formData);

      if (res.data.success) {
        // Refresh the authenticated user
        await useAuthStore.getState().checkAuth();

        toast.success(
          res.data.message || "Profile picture updated successfully",
        );

        return true;
      }

      toast.error(res.data.message || "Upload failed");
      return false;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update profile picture",
      );
      return false;
    } finally {
      set({
        isUpdatingProfilePic: false,
      });
    }
  },
}));
