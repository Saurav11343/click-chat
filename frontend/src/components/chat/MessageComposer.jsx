import { useState } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessageStore } from "@/store/useMessageStore";

export function MessageComposer({
  conversationId,
}) {
  const [content, setContent] = useState("");

  const isSendingMessage = useMessageStore(
    (state) => state.isSendingMessage,
  );

  const sendMessage = useMessageStore(
    (state) => state.sendMessage,
  );

  const trimmedContent = content.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !trimmedContent ||
      !conversationId ||
      isSendingMessage
    ) {
      return;
    }

    const wasSent = await sendMessage(
      conversationId,
      trimmedContent,
    );

    if (wasSent) {
      setContent("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-4xl items-center gap-2"
    >
      <Input
        type="text"
        value={content}
        onChange={(event) =>
          setContent(event.target.value)
        }
        placeholder="Type a message..."
        maxLength={5000}
        disabled={
          !conversationId ||
          isSendingMessage
        }
        autoComplete="off"
        className="min-h-11 flex-1"
        aria-label="Message"
      />

      <Button
        type="submit"
        size="icon"
        disabled={
          !trimmedContent ||
          !conversationId ||
          isSendingMessage
        }
        className="shrink-0"
        aria-label="Send message"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </form>
  );
}