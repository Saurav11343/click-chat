import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Welcome from "../pages/Welcome";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Chat from "../pages/Chat";

import { useAuthStore } from "@/store/useAuthStore";
import { Spinner } from "@/components/ui/spinner";
import Profile from "@/pages/Profile";

function AppRoutes() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
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
    </Routes>
  );
}

export default AppRoutes;
