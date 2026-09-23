// Development-only fixture: npm run dev, then /tests/assistant-preview.html.
// No credentials or real conversations; all API calls stay inside this adapter.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AssistantDialog } from "../src/features/chat/components/AssistantDialog";
import { axiosInstance } from "../src/shared/api/api-client";
import "../src/index.css";

axiosInstance.defaults.adapter = async (config) => {
  const body = config.data ? JSON.parse(config.data) : {};
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (body.query?.includes("error")) throw { response: { data: { message: "Test: quota reached. Try again later." } } };
  return { status: 200, statusText: "OK", headers: {}, config, data: config.url.endsWith("status") ? { ai: true, web: true } : {
    answer: body.mode === "web" ? "React's official tutorial teaches components and state through a practical project. [1]" : "The team agreed to deliver the project on Friday. Alex owns the final review. [1]",
    coverage: body.mode === "web" ? "Web results for your current question. Private chats are not included." : "1 message in the selected period.",
    sources: body.mode === "web" ? [{ kind: "web", number: 1, title: "Quick Start – React", url: "https://react.dev/learn", excerpt: "Learn how to create and nest components, add styles, display data, and respond to events." }] : [{ kind: "chat", number: 1, title: "Project team", conversationId: "222222222222222222222222", messageId: "333333333333333333333333", sender: "Alex", date: "2026-09-20T12:00:00Z", excerpt: "The deadline is Friday. I will handle the final review." }],
  } };
};
export function Preview() {
  const [open, setOpen] = useState(true);
  const [opened, setOpened] = useState("");
  return <><button onClick={() => setOpen(true)}>Open assistant fixture</button><p>{opened}</p><AssistantDialog open={open} onOpenChange={setOpen} conversations={[{ id: "222222222222222222222222", name: "Project team" }]} initialConversationId="222222222222222222222222" onOpenSource={(conversation, message) => setOpened(`Opened ${conversation} / ${message}`)} /></>;
}
createRoot(document.getElementById("root")).render(<Preview />);
