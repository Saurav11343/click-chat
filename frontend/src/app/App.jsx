import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { Toaster } from "@/components/ui/sonner";
import { NativeAppNavigation } from "@/platform/capacitor/NativeAppNavigation";
import { registerPushServiceWorker } from "@/shared/notifications/push-notifications";
import { VideoCallProvider } from "./features/chat/components/VideoCall";
function App() {
  useEffect(() => {
    void registerPushServiceWorker().catch((error) => {
      console.error("Push service worker registration failed:", error);
    });
  }, []);

  return (
    <BrowserRouter>
      <VideoCallProvider>
        <NativeAppNavigation />
        <Toaster richColors position="top-center" />
        <AppRoutes />
      </VideoCallProvider>
    </BrowserRouter>
  );
}

export default App;
