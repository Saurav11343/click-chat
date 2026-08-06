import { useRef, useState } from "react";
import { LoaderCircle, Paperclip, SendHorizontal } from "lucide-react";

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

export function MessageComposer({ conversationId, onTypingChange }) {
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

  const handleEmojiClick = (emojiData) => {
    updateContent(`${content}${emojiData.emoji}`.slice(0, 5000));
    messageInputRef.current?.focus();
  };

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

        <GiphyPicker conversationId={conversationId} disabled={isBusy} />

        <EmojiPickerPopover
          disabled={!conversationId || isBusy}
          isOpen={isEmojiPickerOpen}
          onEmojiClick={handleEmojiClick}
          onOpenChange={setIsEmojiPickerOpen}
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

