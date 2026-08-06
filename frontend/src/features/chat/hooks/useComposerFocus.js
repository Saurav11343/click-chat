import { useEffect } from "react";

export function useComposerFocus({ conversationId, inputRef }) {
  useEffect(() => {
    if (!conversationId) return;

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

      if (isInteractiveTarget) return;

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", handleEnterToFocus);
    return () => window.removeEventListener("keydown", handleEnterToFocus);
  }, [conversationId, inputRef]);
}

