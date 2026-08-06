import { useEffect, useRef } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmojiPickerPopover({
  disabled,
  isOpen,
  onEmojiClick,
  onOpenChange,
  className,
  pickerClassName,
  buttonClassName,
  iconClassName,
  ariaLabel,
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
    <div ref={pickerRef} className={cn("relative shrink-0", className)}>
      {isOpen && (
        <div className={cn("absolute bottom-full left-0 z-50 mb-2", pickerClassName)}>
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
        aria-label={ariaLabel || (isOpen ? "Close emoji picker" : "Open emoji picker")}
        aria-expanded={isOpen}
        className={cn("rounded-xl", buttonClassName)}
      >
        <Smile className={cn("size-5", iconClassName)} />
      </Button>
    </div>
  );
}

