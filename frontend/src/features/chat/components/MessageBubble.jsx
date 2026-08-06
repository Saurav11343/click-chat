import { useState } from "react";

import {
  Check,
  Copy,
  EllipsisVertical,
  Languages,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useMessageStore } from "@/features/chat/store/useMessageStore";
import { axiosInstance } from "@/shared/api/api-client";
import { getLanguageName } from "@/shared/constants/languages";
import { AttachmentContent } from "./message/AttachmentContent";
import { MessageText, YouTubePreview } from "./message/MessageText";
import { getReplyPreview } from "./message/message-utils";

export function MessageBubble({
  message,
  isMyMessage,
  conversationId,
  onMediaLoad,
  showSender = false,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [editedContent, setEditedContent] = useState(message.content || "");
  const [translation, setTranslation] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const editingMessageId = useMessageStore((state) => state.editingMessageId);

  const deletingMessageId = useMessageStore((state) => state.deletingMessageId);

  const editMessage = useMessageStore((state) => state.editMessage);

  const deleteMessage = useMessageStore((state) => state.deleteMessage);

  const isSaving = editingMessageId === message._id;
  const isDeleting = deletingMessageId === message._id;

  const isTextMessage = message.messageType === "text";
  const isSticker = message.messageType === "sticker";
  const hasLink = /https?:\/\/\S+/i.test(message.content || "");
  const canCopy = isTextMessage || hasLink;
  const canTranslate = Boolean(message.content?.trim());
  const canTranslateReceivedMessage = !isMyMessage && canTranslate;
  const hasMessageActions =
    canCopy || isMyMessage || canTranslateReceivedMessage;

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleStartEditing = () => {
    setEditedContent(message.content || "");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditedContent(message.content || "");
    setIsEditing(false);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    const trimmedContent = editedContent.trim();

    if (!trimmedContent || trimmedContent === message.content || isSaving) {
      return;
    }

    const wasEdited = await editMessage(
      conversationId,
      message._id,
      trimmedContent,
    );

    if (wasEdited) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await deleteMessage(conversationId, message._id);
  };

  const handleCopy = async () => {
    const copyValue = message.content?.trim();

    if (!copyValue) {
      toast.error("There is nothing to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(copyValue);
      toast.success("Message copied.");
    } catch {
      toast.error("Unable to copy this message.");
    }
  };

  const handleTranslate = async () => {
    if (translation?.sourceContent === message.content) {
      setShowTranslation((current) => !current);
      return;
    }

    try {
      setIsTranslating(true);
      const response = await axiosInstance.post(
        `/conversations/${conversationId}/messages/${message._id}/translate`,
      );
      setTranslation({
        ...response.data.translation,
        sourceContent: message.content,
      });
      setShowTranslation(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to translate this message.",
      );
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div
      className={`group flex ${isMyMessage ? "justify-end" : "justify-start"}`}
      onLoadCapture={onMediaLoad}
      onLoadedMetadataCapture={onMediaLoad}
    >
      <div
        className={`relative max-w-[86%] rounded-2xl sm:max-w-[72%] ${
          !message.isDeleted && !isEditing && hasMessageActions
            ? "pr-10 sm:pr-10"
            : ""
        } ${
          isSticker && !message.isDeleted
            ? "bg-transparent px-0 py-0 text-foreground shadow-none"
            : isMyMessage
            ? "message-bubble-sent rounded-br-sm"
            : "message-bubble-received rounded-bl-sm ring-1 ring-foreground/8"
        } ${
          !isSticker || message.isDeleted ? "px-3.5 py-2.5 sm:px-4" : ""
        }`}
      >
        {showSender && !isMyMessage && message.sender && (
          <p className="mb-1 truncate text-xs font-semibold text-primary">
            {[message.sender.firstName, message.sender.lastName]
              .filter(Boolean)
              .join(" ")}
          </p>
        )}

        {!message.isDeleted && !isEditing && hasMessageActions && (
          <div className="absolute right-1 top-1 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isDeleting}
                  className={`size-7 rounded-lg shadow-none ${
                    isMyMessage && !isSticker
                      ? "text-primary-foreground/75 hover:bg-primary-foreground/15 hover:text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-label="Message options"
                >
                  <EllipsisVertical className="size-3.5 text-current" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" side="bottom">
                {canCopy && (
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="size-4" />
                    Copy
                  </DropdownMenuItem>
                )}

                {canTranslateReceivedMessage && (
                  <DropdownMenuItem
                    onClick={handleTranslate}
                    disabled={isTranslating}
                  >
                    <Languages className="size-4" />
                    {isTranslating
                      ? "Translating..."
                      : showTranslation
                        ? "Hide translation"
                        : translation
                          ? "Show translation"
                          : "Translate"}
                  </DropdownMenuItem>
                )}

                {isMyMessage && isTextMessage && (
                  <DropdownMenuItem onClick={handleStartEditing}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                )}

                {isMyMessage && (
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={handleDelete}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {message.replyTo && !message.isDeleted && (
          <div
            className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-xs ${
              isMyMessage
                ? "border-primary-foreground/50 bg-primary-foreground/10"
                : "border-primary/50 bg-muted"
            }`}
          >
            <p className="truncate opacity-80">
              {getReplyPreview(message.replyTo)}
            </p>
          </div>
        )}

        {message.isDeleted ? (
          <p className="text-sm italic opacity-70">This message was deleted</p>
        ) : isEditing ? (
          <form
            onSubmit={handleEditSubmit}
            className="flex min-w-56 items-center gap-2"
          >
            <Input
              value={editedContent}
              onChange={(event) => setEditedContent(event.target.value)}
              maxLength={5000}
              disabled={isSaving}
              autoFocus
              aria-label="Edit message"
              className="h-9 bg-background text-foreground"
            />

            <Button
              type="submit"
              size="icon-sm"
              disabled={
                !editedContent.trim() ||
                editedContent.trim() === message.content ||
                isSaving
              }
              aria-label="Save edited message"
            >
              <Check className="size-4" />
            </Button>

            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={isSaving}
              onClick={handleCancelEditing}
              aria-label="Cancel editing"
            >
              <X className="size-4" />
            </Button>
          </form>
        ) : (
          <>
            {(message.attachment || message.gif || message.externalMedia) && (
              <AttachmentContent
                message={message}
                isMyMessage={isMyMessage}
                conversationId={conversationId}
              />
            )}

            {message.content && (
              <div className={message.attachment ? "mt-2" : ""}>
                <MessageText content={message.content} />

                <YouTubePreview content={message.content} />

                {showTranslation &&
                  translation?.sourceContent === message.content && (
                    <div
                      className={`mt-2 rounded-xl border px-3 py-2 ${
                        isMyMessage && !isSticker
                          ? "border-primary-foreground/20 bg-primary-foreground/10"
                          : "border-border bg-muted/60"
                      }`}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide opacity-65">
                        {getLanguageName(translation.targetLanguage)} translation
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {translation.text}
                      </p>
                    </div>
                  )}

              </div>
            )}
          </>
        )}

        <div className="mt-1.5 flex items-center justify-end gap-1.5">
          {message.isEdited && !message.isDeleted && (
            <span
              className={`text-[10px] ${
                isMyMessage && !isSticker
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              edited
            </span>
          )}

          <span
            className={`text-[10px] sm:text-[11px] ${
              isMyMessage && !isSticker
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            }`}
          >
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}

