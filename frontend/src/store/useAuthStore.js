import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { toast } from "sonner";

export const useAuthStore = create((set) => ({
  authUser: false,
  isRegisteringUp: false,

  register: async (data) => {
    set({ isRegisteringUp: true });

    try {
      const res = await axiosInstance.post("/auth/register", data);

      if (res.data.success) {
        toast.success(res.data.message || "Registered successfully");
        return true;
      } else {
        toast.error(res.data.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      set({ isRegisteringUp: false });
    }
  },
}));
