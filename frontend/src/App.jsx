import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "./components/ui/sonner";
import { NativeAppNavigation } from "./components/NativeAppNavigation";

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
