import { useEffect, useRef, useState } from "react";
import { SendHorizontal, Smile } from "lucide-react";

import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessageStore } from "@/store/useMessageStore";

export function MessageComposer({ conversationId }) {
  const [content, setContent] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef(null);

  const isSendingMessage = useMessageStore((state) => state.isSendingMessage);

  const sendMessage = useMessageStore((state) => state.sendMessage);

  const trimmedContent = content.trim();

  useEffect(() => {
    setContent("");
    setIsEmojiPickerOpen(false);
  }, [conversationId]);

  useEffect(() => {
    if (!isEmojiPickerOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  const handleEmojiClick = (emojiData) => {
    setContent((currentContent) => {
      const nextContent = currentContent + emojiData.emoji;

      return nextContent.slice(0, 5000);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!trimmedContent || !conversationId || isSendingMessage) {
      return;
    }

    const wasSent = await sendMessage(conversationId, trimmedContent);

    if (wasSent) {
      setContent("");
      setIsEmojiPickerOpen(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto flex max-w-4xl items-center gap-2"
    >
      <div ref={emojiPickerRef} className="relative shrink-0">
        {isEmojiPickerOpen && (
          <div className="absolute bottom-full left-0 z-50 mb-2">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              emojiStyle={EmojiStyle.NATIVE}
              theme={Theme.AUTO}
              width="min(350px, calc(100vw - 2rem))"
              height={400}
              lazyLoadEmojis
              previewConfig={{
                showPreview: false,
              }}
            />
          </div>
        )}

        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={!conversationId || isSendingMessage}
          onClick={() => setIsEmojiPickerOpen((currentValue) => !currentValue)}
          aria-label={
            isEmojiPickerOpen ? "Close emoji picker" : "Open emoji picker"
          }
          aria-expanded={isEmojiPickerOpen}
        >
          <Smile className="size-5" />
        </Button>
      </div>

      <Input
        type="text"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Type a message..."
        maxLength={5000}
        disabled={!conversationId || isSendingMessage}
        autoComplete="off"
        className="min-h-11 flex-1"
        aria-label="Message"
      />

      <Button
        type="submit"
        size="icon"
        disabled={!trimmedContent || !conversationId || isSendingMessage}
        className="shrink-0"
        aria-label="Send message"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </form>
  );
}
