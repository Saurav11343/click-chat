import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

function closeOpenOverlay() {
  const openOverlay = document.querySelector(
    '[role="dialog"][data-state="open"], [role="menu"][data-state="open"]',
  );

  if (!openOverlay) return false;

  openOverlay.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      bubbles: true,
      cancelable: true,
    }),
  );

  return true;
}

export function NativeAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return undefined;

    let listener;
    let disposed = false;

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (closeOpenOverlay()) return;

      const searchParams = new URLSearchParams(location.search);

      if (location.pathname === "/chat" && searchParams.has("conversation")) {
        navigate("/chat", { replace: true });
        return;
      }

      if (location.pathname !== "/" && location.pathname !== "/chat") {
        if (canGoBack) {
          navigate(-1);
        } else {
          navigate("/", { replace: true });
        }
        return;
      }

      CapacitorApp.exitApp();
    }).then((handle) => {
      if (disposed) {
        handle.remove();
      } else {
        listener = handle;
      }
    });

    return () => {
      disposed = true;
      listener?.remove();
    };
  }, [location.pathname, location.search, navigate]);

  return null;
}
