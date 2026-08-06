import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Keyboard } from "@capacitor/keyboard";
import { toast } from "sonner";

const EXIT_CONFIRMATION_WINDOW_MS = 2_000;

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

    document.documentElement.classList.add("native-android");

    let backListener;
    let keyboardShowListener;
    let keyboardHideListener;
    let disposed = false;
    let lastExitRequestAt = 0;

    void Keyboard.addListener("keyboardWillShow", () => {
      document.documentElement.classList.add("native-keyboard-open");
    }).then((handle) => {
      if (disposed) handle.remove();
      else keyboardShowListener = handle;
    });

    void Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.classList.remove("native-keyboard-open");
    }).then((handle) => {
      if (disposed) handle.remove();
      else keyboardHideListener = handle;
    });

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

      const now = Date.now();
      if (now - lastExitRequestAt <= EXIT_CONFIRMATION_WINDOW_MS) {
        CapacitorApp.exitApp();
        return;
      }

      lastExitRequestAt = now;
      toast("Press back again to exit", { duration: EXIT_CONFIRMATION_WINDOW_MS });
    }).then((handle) => {
      if (disposed) {
        handle.remove();
      } else {
        backListener = handle;
      }
    });

    return () => {
      disposed = true;
      backListener?.remove();
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
      document.documentElement.classList.remove(
        "native-android",
        "native-keyboard-open",
      );
    };
  }, [location.pathname, location.search, navigate]);

  return null;
}
