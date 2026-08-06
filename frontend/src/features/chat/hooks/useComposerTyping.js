import { useCallback, useEffect, useRef } from "react";

const TYPING_IDLE_TIMEOUT_MS = 1500;

export function useComposerTyping({ conversationId, onTypingChange }) {
  const timeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isTypingRef.current && conversationId && onTypingChange) {
      onTypingChange(conversationId, false);
    }

    isTypingRef.current = false;
  }, [conversationId, onTypingChange]);

  const updateTyping = useCallback(
    (content) => {
      if (!content.trim()) {
        stopTyping();
        return;
      }

      if (!conversationId || !onTypingChange) return;

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingChange(conversationId, true);
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(stopTyping, TYPING_IDLE_TIMEOUT_MS);
    },
    [conversationId, onTypingChange, stopTyping],
  );

  useEffect(() => stopTyping, [stopTyping]);

  return { stopTyping, updateTyping };
}

