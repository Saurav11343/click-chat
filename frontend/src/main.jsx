import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import App from "./app/App.jsx";
import { VideoCallProvider } from "./features/chat/components/VideoCall";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <VideoCallProvider>
        <App />
      </VideoCallProvider>
    </ThemeProvider>
  </StrictMode>,
);
