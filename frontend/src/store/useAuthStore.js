import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { toast } from "sonner";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: false,
  isRegisteringUp: false,
  isLoggingIn: false,
  isLoggingOut: false,
  isResendingVerification: false,

  register: async (data) => {
    set({ isRegisteringUp: true });

    try {
      const res = await axiosInstance.post("/auth/register", data);

      if (res.data.success) {
        toast.success(res.data.message || "Registered successfully");
        return res.data;
      } else {
        toast.error(res.data.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      set({ isRegisteringUp: false });
    }
  },

  resendVerificationEmail: async (email) => {
    set({
      isResendingVerification: true,
    });

    try {
      const response = await axiosInstance.post("/auth/resend-verification", {
        email,
      });

      toast.success(
        response.data.message || "A new verification email has been sent.",
      );

      return {
        success: true,
        retryAfter: 60,
      };
    } catch (error) {
      const retryAfter = error.response?.data?.retryAfter || 0;

      toast.error(
        error.response?.data?.message ||
          "Unable to resend the verification email.",
      );

      return {
        success: false,
        retryAfter,
      };
    } finally {
      set({
        isResendingVerification: false,
      });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/login", data);

      if (res.data.success) {
        await get().checkAuth();

        toast.success(res.data.message || "Login successful");

        return {
          success: true,
        };
      }

      toast.error(res.data.message || "Login failed");

      return {
        success: false,
        requiresEmailVerification: false,
      };
    } catch (error) {
      const errorData = error.response?.data;

      toast.error(errorData?.message || "Login failed");

      return {
        success: false,
        requiresEmailVerification:
          errorData?.requiresEmailVerification || false,
      };
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
