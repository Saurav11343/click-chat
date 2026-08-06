import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { Toaster } from "@/components/ui/sonner";
import { NativeAppNavigation } from "@/platform/capacitor/NativeAppNavigation";

function App() {
  return (
    <BrowserRouter>
      <NativeAppNavigation />
      <Toaster richColors position="top-center" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
