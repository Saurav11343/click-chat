import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { AppLoadingScreen } from "@/shared/components/AppLoadingScreen";

const Welcome = lazy(() => import("@/features/landing/pages/Welcome"));
const Login = lazy(() => import("@/features/auth/pages/Login"));
const Register = lazy(() => import("@/features/auth/pages/Register"));
const Chat = lazy(() => import("@/features/chat/pages/Chat"));
const Profile = lazy(() => import("@/features/profile/pages/Profile"));
const VerifyEmail = lazy(() => import("@/features/auth/pages/VerifyEmail"));
const CheckEmail = lazy(() => import("@/features/auth/pages/CheckEmail"));
const ForgotPassword = lazy(() =>
  import("@/features/auth/pages/ForgotPassword"),
);
const ResetPassword = lazy(() =>
  import("@/features/auth/pages/ResetPassword"),
);
const Settings = lazy(() => import("@/features/settings/pages/Settings"));

function AppRoutes() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <AppLoadingScreen />;
  }

  return (
    <Suspense fallback={<AppLoadingScreen />}>
      <Routes>
      <Route
        path="/"
        element={authUser ? <Navigate to="/chat" replace /> : <Welcome />}
      />

      <Route
        path="/login"
        element={authUser ? <Navigate to="/chat" replace /> : <Login />}
      />

      <Route
        path="/register"
        element={authUser ? <Navigate to="/chat" replace /> : <Register />}
      />

      <Route
        path="/chat"
        element={authUser ? <Chat /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/profile"
        element={authUser ? <Profile /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/settings"
        element={authUser ? <Settings /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/verify-email"
        element={authUser ? <Navigate to="/chat" replace /> : <VerifyEmail />}
      />

      <Route
        path="/check-email"
        element={authUser ? <Navigate to="/chat" replace /> : <CheckEmail />}
      />

      <Route
        path="/forgot-password"
        element={authUser ? <Navigate to="/chat" replace /> : <ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={authUser ? <Navigate to="/chat" replace /> : <ResetPassword />}
      />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
