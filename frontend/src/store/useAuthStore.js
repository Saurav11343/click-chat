import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { toast } from "sonner";

import { socket } from "@/lib/socket";

const AUTH_CHECK_ATTEMPTS = 6;
const AUTH_CHECK_TIMEOUT = 15000;
const AUTH_CHECK_RETRY_DELAY = 2500;

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const isTemporaryStartupError = (error) => {
  const status = error.response?.status;

  return (
    !error.response ||
    error.code === "ECONNABORTED" ||
    [502, 503, 504].includes(status)
  );
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: false,
  isRegisteringUp: false,
  isLoggingIn: false,
  isLoggingOut: false,
  isResendingVerification: false,
  isChangingPassword: false,
  isRequestingPasswordReset: false,
  isResettingPassword: false,
  isLoggingInWithGoogle: false,

  googleLogin: async (credential) => {
    set({ isLoggingInWithGoogle: true });

    try {
      const response = await axiosInstance.post("/auth/google", { credential });
      await get().checkAuth();
      toast.success(response.data.message || "Signed in with Google");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Google sign-in failed");
      return false;
    } finally {
      set({ isLoggingInWithGoogle: false });
    }
  },

  changePassword: async (data) => {
    set({ isChangingPassword: true });

    try {
      const response = await axiosInstance.patch("/auth/change-password", data);
      toast.success(response.data.message || "Password changed successfully");
      return true;
    } catch (error) {
      const errors = error.response?.data?.errors;
      const firstError = errors
        ? Object.values(errors).flat().find(Boolean)
        : null;
      toast.error(firstError || error.response?.data?.message || "Unable to change password");
      return false;
    } finally {
      set({ isChangingPassword: false });
    }
  },

  requestPasswordReset: async (email) => {
    set({ isRequestingPasswordReset: true });

    try {
      const response = await axiosInstance.post("/auth/forgot-password", { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to request password reset");
      return { success: false };
    } finally {
      set({ isRequestingPasswordReset: false });
    }
  },

  resetPassword: async (data) => {
    set({ isResettingPassword: true });

    try {
      const response = await axiosInstance.post("/auth/reset-password", data);
      toast.success(response.data.message || "Password reset successfully");
      return true;
    } catch (error) {
      const errors = error.response?.data?.errors;
      const firstError = errors
        ? Object.values(errors).flat().find(Boolean)
        : null;
      toast.error(firstError || error.response?.data?.message || "Unable to reset password");
      return false;
    } finally {
      set({ isResettingPassword: false });
    }
  },

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

      if (res.data.success) {
        socket.disconnect();

        set({
          authUser: null,
        });

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
      for (let attempt = 1; attempt <= AUTH_CHECK_ATTEMPTS; attempt += 1) {
        try {
          const res = await axiosInstance.get("/auth/check", {
            timeout: AUTH_CHECK_TIMEOUT,
          });

          set({ authUser: res.data.user });

          if (!socket.connected) {
            socket.connect();
          }

          return true;
        } catch (error) {
          const shouldRetry =
            isTemporaryStartupError(error) && attempt < AUTH_CHECK_ATTEMPTS;

          if (!shouldRetry) {
            socket.disconnect();
            set({ authUser: null });
            return false;
          }

          await wait(AUTH_CHECK_RETRY_DELAY);
        }
      }

      return false;
    } finally {
      set({
        isCheckingAuth: false,
      });
    }
  },
}));

socket.on("connect", () => {
  useAuthStore.setState((state) => {
    if (!state.authUser) {
      return state;
    }

    return {
      authUser: {
        ...state.authUser,
        isOnline: true,
        lastSeen: null,
      },
    };
  });
});
