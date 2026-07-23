import { useState } from "react";
import { Check, EllipsisVertical, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useMessageStore } from "@/store/useMessageStore";

export function MessageBubble({ message, isMyMessage, conversationId }) {
  const [isEditing, setIsEditing] = useState(false);

  const [editedContent, setEditedContent] = useState(message.content || "");

  const editingMessageId = useMessageStore((state) => state.editingMessageId);

  const deletingMessageId = useMessageStore((state) => state.deletingMessageId);

  const editMessage = useMessageStore((state) => state.editMessage);

  const deleteMessage = useMessageStore((state) => state.deleteMessage);

  const isSaving = editingMessageId === message._id;

  const isDeleting = deletingMessageId === message._id;

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

  return (
    <div
      className={`group flex ${isMyMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative max-w-[85%] rounded-2xl px-3 py-2.5 sm:max-w-[70%] sm:px-4 ${
          isMyMessage
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border bg-background"
        }`}
      >
        {isMyMessage && !message.isDeleted && !isEditing && (
          <div className="absolute -left-10 top-1 z-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={isDeleting}
                  className="border-border bg-background text-foreground shadow-sm hover:bg-muted hover:text-foreground"
                  aria-label="Message options"
                >
                  <EllipsisVertical className="size-4 text-current" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" side="left">
                <DropdownMenuItem onClick={handleStartEditing}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
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
              {message.replyTo.isDeleted
                ? "Original message was deleted"
                : message.replyTo.content}
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
          <p className="break-words text-sm leading-relaxed">
            {message.content}
          </p>
        )}

        <div className="mt-1 flex items-center justify-end gap-1.5">
          {message.isEdited && !message.isDeleted && (
            <span
              className={`text-[10px] ${
                isMyMessage
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              edited
            </span>
          )}

          <span
            className={`text-[10px] sm:text-[11px] ${
              isMyMessage
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
