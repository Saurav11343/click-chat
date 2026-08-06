import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Paperclip, Reply, SendHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessageStore } from "@/features/chat/store/useMessageStore";
import { EmojiPickerPopover } from "./composer/EmojiPickerPopover";
import { SelectedFilePreview } from "./composer/SelectedFilePreview";
import { GiphyPicker } from "./GiphyPicker";
import {
  FILE_INPUT_ACCEPT,
  useAttachmentSelection,
} from "../hooks/useAttachmentSelection";
import { useComposerFocus } from "../hooks/useComposerFocus";
import { useComposerTyping } from "../hooks/useComposerTyping";
import { getReplyPreview } from "./message/message-utils";

export function MessageComposer({
  conversationId,
  onTypingChange,
  replyingTo,
  onCancelReply,
  reactionTarget,
  onCancelReaction,
}) {
  const [content, setContent] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const messageInputRef = useRef(null);

  const isSendingMessage = useMessageStore((state) => state.isSendingMessage);
  const isSendingAttachment = useMessageStore(
    (state) => state.isSendingAttachment,
  );
  const isSendingExternalMedia = useMessageStore(
    (state) => state.isSendingExternalMedia,
  );
  const attachmentUploadProgress = useMessageStore(
    (state) => state.attachmentUploadProgress,
  );
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const sendAttachment = useMessageStore((state) => state.sendAttachment);
  const toggleReaction = useMessageStore((state) => state.toggleReaction);

  const {
    clearSelectedFile,
    fileInputRef,
    previewUrl,
    selectedFile,
    selectFile,
  } = useAttachmentSelection();
  const { stopTyping, updateTyping } = useComposerTyping({
    conversationId,
    onTypingChange,
  });

  useComposerFocus({ conversationId, inputRef: messageInputRef });

  useEffect(() => {
    if (replyingTo?._id) {
      messageInputRef.current?.focus();
    }
  }, [replyingTo?._id]);

  const trimmedContent = content.trim();
  const isBusy =
    isSendingMessage || isSendingAttachment || isSendingExternalMedia;
  const canSend = Boolean(
    conversationId && !isBusy && (trimmedContent || selectedFile),
  );

  const updateContent = (nextContent) => {
    setContent(nextContent);
    updateTyping(nextContent);
  };

  const handleEmojiClick = async (emojiData) => {
    if (reactionTarget?._id) {
      const updated = await toggleReaction(
        conversationId,
        reactionTarget._id,
        emojiData.emoji,
      );
      if (updated) {
        setIsEmojiPickerOpen(false);
        onCancelReaction?.();
      }
      return;
    }

    updateContent(`${content}${emojiData.emoji}`.slice(0, 5000));
    messageInputRef.current?.focus();
  };

  const handleEmojiPickerOpenChange = (open) => {
    setIsEmojiPickerOpen(open);
    if (!open && reactionTarget) onCancelReaction?.();
  };

  const isPickerOpen = isEmojiPickerOpen || Boolean(reactionTarget?._id);

  const handleFileChange = (event) => {
    const wasSelected = selectFile(event.target.files?.[0]);

    if (!wasSelected) {
      event.target.value = "";
      return;
    }

    setIsEmojiPickerOpen(false);
    messageInputRef.current?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    stopTyping();

    const wasSent = selectedFile
      ? await sendAttachment({
          conversationId,
          file: selectedFile,
          content: trimmedContent,
          replyTo: replyingTo?._id || null,
        })
      : await sendMessage(conversationId, trimmedContent, replyingTo?._id || null);

    if (wasSent) {
      setContent("");
      clearSelectedFile();
      setIsEmojiPickerOpen(false);
      onCancelReply?.();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto flex max-w-5xl flex-col rounded-2xl border bg-muted/50 p-1.5 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15"
    >
      {replyingTo && (
        <div className="mb-1 flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm ring-1 ring-foreground/8">
          <Reply className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-primary">
              Replying to {getSenderName(replyingTo.sender)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {getReplyPreview(replyingTo)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onCancelReply}
            disabled={isBusy}
            className="shrink-0 rounded-lg"
            aria-label="Cancel reply"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {selectedFile && (
        <SelectedFilePreview
          file={selectedFile}
          previewUrl={previewUrl}
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

        <GiphyPicker
          conversationId={conversationId}
          disabled={isBusy}
          replyTo={replyingTo?._id || null}
          onSent={onCancelReply}
        />

        <EmojiPickerPopover
          disabled={!conversationId || isBusy}
          isOpen={isPickerOpen}
          onEmojiClick={handleEmojiClick}
          onOpenChange={handleEmojiPickerOpenChange}
        />

        <Input
          ref={messageInputRef}
          type="text"
          value={content}
          onChange={(event) => updateContent(event.target.value)}
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

function getSenderName(sender) {
  if (!sender || typeof sender === "string") return "message";
  return [sender.firstName, sender.lastName].filter(Boolean).join(" ") || "message";
}

