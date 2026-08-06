import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { Toaster } from "@/components/ui/sonner";
import { NativeAppNavigation } from "@/platform/capacitor/NativeAppNavigation";
import { registerPushServiceWorker } from "@/shared/notifications/push-notifications";

function App() {
  useEffect(() => {
    void registerPushServiceWorker().catch((error) => {
      console.error("Push service worker registration failed:", error);
    });
  }, []);

  return (
    <BrowserRouter>
      <NativeAppNavigation />
      <Toaster richColors position="top-center" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
