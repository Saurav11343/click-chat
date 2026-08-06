import { useEffect, useRef } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmojiPickerPopover({
  disabled,
  isOpen,
  onEmojiClick,
  onOpenChange,
}) {
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen, onOpenChange]);

  return (
    <div ref={pickerRef} className="relative shrink-0">
      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.AUTO}
            width="min(350px, calc(100vw - 2rem))"
            height={400}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
        aria-label={isOpen ? "Close emoji picker" : "Open emoji picker"}
        aria-expanded={isOpen}
        className="rounded-xl"
      >
        <Smile className="size-5" />
      </Button>
    </div>
  );
}

