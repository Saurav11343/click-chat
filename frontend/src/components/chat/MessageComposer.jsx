import { useCallback, useEffect, useRef, useState } from "react";

import {
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Music,
  Paperclip,
  SendHorizontal,
  Smile,
  Video,
  X,
} from "lucide-react";

import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessageStore } from "@/store/useMessageStore";
import { GifPicker } from "@/components/chat/GifPicker";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  "video/mp4",
  "video/webm",
  "video/quicktime",

  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",

  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "text/plain",
  "text/csv",
]);

const FILE_INPUT_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "application/pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
].join(",");

export function MessageComposer({ conversationId, onTypingChange }) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState(null);

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const emojiPickerRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const isSendingMessage = useMessageStore((state) => state.isSendingMessage);

  const isSendingAttachment = useMessageStore(
    (state) => state.isSendingAttachment,
  );

  const isSendingGif = useMessageStore((state) => state.isSendingGif);

  const attachmentUploadProgress = useMessageStore(
    (state) => state.attachmentUploadProgress,
  );

  const sendMessage = useMessageStore((state) => state.sendMessage);

  const sendAttachment = useMessageStore((state) => state.sendAttachment);

  const trimmedContent = content.trim();

  const isBusy = isSendingMessage || isSendingAttachment || isSendingGif;

  const canSend = Boolean(
    conversationId && !isBusy && (trimmedContent || selectedFile),
  );

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFilePreview(null);
  }, []);

  const clearSelectedFile = useCallback(() => {
    revokePreviewUrl();
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [revokePreviewUrl]);

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
      revokePreviewUrl();
    };
  }, [stopTyping, revokePreviewUrl]);

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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      toast.error("This file type is not supported.");
      event.target.value = "";
      return;
    }

    if (file.size <= 0) {
      toast.error("The selected file is empty.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File cannot exceed 10 MB.");
      event.target.value = "";
      return;
    }

    revokePreviewUrl();
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);

      previewUrlRef.current = previewUrl;
      setSelectedFilePreview(previewUrl);
    }

    setIsEmojiPickerOpen(false);
    messageInputRef.current?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    stopTyping();

    const wasSent = selectedFile
      ? await sendAttachment({
          conversationId,
          file: selectedFile,
          content: trimmedContent,
        })
      : await sendMessage(conversationId, trimmedContent);

    if (wasSent) {
      setContent("");
      clearSelectedFile();
      setIsEmojiPickerOpen(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto flex max-w-5xl flex-col rounded-2xl border bg-muted/50 p-1.5 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15"
    >
      {selectedFile && (
        <SelectedFilePreview
          file={selectedFile}
          previewUrl={selectedFilePreview}
          isUploading={isSendingAttachment}
          uploadProgress={attachmentUploadProgress}
          onRemove={clearSelectedFile}
        />
      )}

      <div className="flex items-center gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_INPUT_ACCEPT}
          onChange={handleFileChange}
          disabled={!conversationId || isBusy}
          className="hidden"
          aria-label="Select an attachment"
        />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={!conversationId || isBusy}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
          className="shrink-0 rounded-xl"
        >
          <Paperclip className="size-5" />
        </Button>

        <GifPicker conversationId={conversationId} disabled={isBusy} />

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
            disabled={!conversationId || isBusy}
            onClick={() =>
              setIsEmojiPickerOpen((currentValue) => !currentValue)
            }
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
          placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
          maxLength={5000}
          disabled={!conversationId || isBusy}
          autoComplete="off"
          className="min-h-10 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
          aria-label={selectedFile ? "Attachment caption" : "Message"}
        />

        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          className="shrink-0 rounded-xl"
          aria-label={selectedFile ? "Send attachment" : "Send message"}
        >
          {isBusy ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}

function SelectedFilePreview({
  file,
  previewUrl,
  isUploading,
  uploadProgress,
  onRemove,
}) {
  return (
    <div className="mb-1 rounded-xl border bg-background/80 p-2">
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="size-14 shrink-0 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AttachmentIcon mimeType={file.type} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>

          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
            {isUploading ? ` · Uploading ${uploadProgress}%` : ""}
          </p>
        </div>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={isUploading}
          onClick={onRemove}
          aria-label="Remove attachment"
          className="shrink-0 rounded-lg"
        >
          <X className="size-4" />
        </Button>
      </div>

      {isUploading && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Attachment upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={uploadProgress}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{
              width: `${uploadProgress}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function AttachmentIcon({ mimeType }) {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="size-5" />;
  }

  if (mimeType.startsWith("video/")) {
    return <Video className="size-5" />;
  }

  if (mimeType.startsWith("audio/")) {
    return <Music className="size-5" />;
  }

  return <FileText className="size-5" />;
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
