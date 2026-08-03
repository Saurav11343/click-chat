import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Welcome from "../pages/Welcome";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Chat from "../pages/Chat";

import { useAuthStore } from "@/store/useAuthStore";
import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import Profile from "@/pages/Profile";
import VerifyEmail from "../pages/VerifyEmail";
import CheckEmail from "../pages/CheckEmail";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Settings from "@/pages/Settings";

function AppRoutes() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <AppLoadingScreen />;
  }

  return (
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
  );
}

export default AppRoutes;
