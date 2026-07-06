import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { toast } from "sonner";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: false,
  isRegisteringUp: false,
  isLoggingIn: false,
  isLoggingOut: false,

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

  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/login", data);

      if (res.data.success) {
        await get().checkAuth();
        toast.success(res.data.message || "Login successful");
        return true;
      } else {
        toast.error(res.data.message || "Login Failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    set({ isLoggingOut: true });

    try {
      const res = await axiosInstance.get("/auth/logout");
      set({
        authUser: null,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Logout successful");
        return true;
      } else {
        toast.error(res.data.message || "Logout Failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    } finally {
      set({ isLoggingOut: false });
    }
  },

  checkAuth: async () => {
    set({
      isCheckingAuth: true,
    });

    try {
      const res = await axiosInstance.get("/auth/check");

      set({
        authUser: res.data.user,
      });

      return true;
    } catch (error) {
      set({
        authUser: null,
      });

      return false;
    } finally {
      set({
        isCheckingAuth: false,
      });
    }
  },
}));
