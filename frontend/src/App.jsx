import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "./components/ui/sonner";
function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
