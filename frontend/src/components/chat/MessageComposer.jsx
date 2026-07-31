import { useCallback, useEffect, useRef, useState } from "react";
import { SendHorizontal, Smile } from "lucide-react";

import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessageStore } from "@/store/useMessageStore";

export function MessageComposer({ conversationId, onTypingChange }) {
  const [content, setContent] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const isSendingMessage = useMessageStore((state) => state.isSendingMessage);

  const sendMessage = useMessageStore((state) => state.sendMessage);

  const trimmedContent = content.trim();
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current && conversationId && onTypingChange) {
      onTypingChange(conversationId, false);
    }

    isTypingRef.current = false;
  }, [conversationId, onTypingChange]);

  const scheduleTypingStop = useCallback(() => {
    if (!conversationId || !onTypingChange) {
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange(conversationId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        onTypingChange(conversationId, false);
        isTypingRef.current = false;
      }

      typingTimeoutRef.current = null;
    }, 1500);
  }, [conversationId, onTypingChange]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

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

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const handleEnterToFocus = (event) => {
      if (
        event.key !== "Enter" ||
        event.defaultPrevented ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      const isInteractiveTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            "input, textarea, select, button, a, [role='button'], [role='dialog'], [role='alertdialog'], [role='menu'], [role='menuitem'], [role='option']",
          ));

      if (isInteractiveTarget) {
        return;
      }

      event.preventDefault();
      messageInputRef.current?.focus();
    };

    window.addEventListener("keydown", handleEnterToFocus);

    return () => {
      window.removeEventListener("keydown", handleEnterToFocus);
    };
  }, [conversationId]);

  const handleEmojiClick = (emojiData) => {
    const nextContent = `${content}${emojiData.emoji}`.slice(0, 5000);

    setContent(nextContent);

    if (nextContent.trim()) {
      scheduleTypingStop();
    } else {
      stopTyping();
    }

    messageInputRef.current?.focus();
  };

  const handleContentChange = (event) => {
    const nextContent = event.target.value;

    setContent(nextContent);

    if (nextContent.trim()) {
      scheduleTypingStop();
    } else {
      stopTyping();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!trimmedContent || !conversationId || isSendingMessage) {
      return;
    }

    stopTyping();

    const wasSent = await sendMessage(conversationId, trimmedContent);

    if (wasSent) {
      setContent("");
      setIsEmojiPickerOpen(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto flex max-w-5xl items-center gap-1.5 rounded-2xl border bg-muted/50 p-1.5 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15"
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
          className="rounded-xl"
        >
          <Smile className="size-5" />
        </Button>
      </div>

      <Input
        ref={messageInputRef}
        type="text"
        value={content}
        onChange={handleContentChange}
        placeholder="Type a message..."
        maxLength={5000}
        disabled={!conversationId || isSendingMessage}
        autoComplete="off"
        className="min-h-10 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
        aria-label="Message"
      />

      <Button
        type="submit"
        size="icon"
        disabled={!trimmedContent || !conversationId || isSendingMessage}
        className="shrink-0 rounded-xl"
        aria-label="Send message"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </form>
  );
}
