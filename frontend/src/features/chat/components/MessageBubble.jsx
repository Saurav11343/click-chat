import { useState } from "react";

import {
  Check,
  CheckCheck,
  Copy,
  EllipsisVertical,
  Languages,
  Pencil,
  Reply,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useMessageStore } from "@/features/chat/store/useMessageStore";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { axiosInstance } from "@/shared/api/api-client";
import { getLanguageName } from "@/shared/constants/languages";
import { AttachmentContent } from "./message/AttachmentContent";
import { MessageText, YouTubePreview } from "./message/MessageText";
import { getReplyPreview } from "./message/message-utils";
import { PublicProfileDialog } from "./PublicProfileDialog";

export function MessageBubble({
  message,
  isMyMessage,
  conversationId,
  onMediaLoad,
  showSender = false,
  participantCount = 0,
  onReply,
  onReplyClick,
  onReact,
  isHighlighted = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const authUserId = useAuthStore((state) => state.authUser?._id);

  const [editedContent, setEditedContent] = useState(message.content || "");
  const [translation, setTranslation] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const editingMessageId = useMessageStore((state) => state.editingMessageId);

  const deletingMessageId = useMessageStore((state) => state.deletingMessageId);

  const editMessage = useMessageStore((state) => state.editMessage);

  const deleteMessage = useMessageStore((state) => state.deleteMessage);
  const reactingMessageId = useMessageStore((state) => state.reactingMessageId);

  const isSaving = editingMessageId === message._id;
  const isDeleting = deletingMessageId === message._id;
  const isReacting = reactingMessageId === message._id;

  const isTextMessage = message.messageType === "text";
  const isGif = message.messageType === "gif";
  const isImage = message.messageType === "image";
  const isSticker = message.messageType === "sticker";
  const isBareGif = isGif && !message.isDeleted && !isEditing;
  const isBareImage =
    isImage &&
    !message.content?.trim() &&
    !message.isDeleted &&
    !isEditing;
  const isBareMedia = isBareGif || isBareImage;
  const hasLink = /https?:\/\/\S+/i.test(message.content || "");
  const canCopy = isTextMessage || hasLink;
  const canTranslate = Boolean(message.content?.trim());
  const canTranslateReceivedMessage = !isMyMessage && canTranslate;
  const hasMessageActions = !message.isDeleted;

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const receiptStatus = isMyMessage
    ? getReceiptStatus(message, participantCount)
    : null;
  const senderProfile = getSenderProfile(message.sender);

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
      <div className={`flex w-full flex-col ${isMyMessage ? "items-end" : "items-start"}`}>
      <div
        className={`relative rounded-2xl transition-[box-shadow] duration-300 ${
          isBareMedia
            ? "w-[min(280px,86vw)]"
            : "max-w-[86%] sm:max-w-[72%]"
        } ${
          !message.isDeleted && !isEditing && hasMessageActions && !isBareMedia
            ? "pr-10"
            : ""
        } ${
          isSticker && !message.isDeleted
            ? "bg-transparent px-0 py-0 text-foreground shadow-none"
            : isBareMedia
              ? "bg-transparent p-0 text-foreground shadow-none"
            : isMyMessage
            ? "message-bubble-sent rounded-br-sm"
            : "message-bubble-received rounded-bl-sm ring-1 ring-foreground/8"
        } ${
          (!isSticker && !isBareMedia) || message.isDeleted
            ? "px-3.5 py-2.5 sm:px-4"
            : ""
        } ${isHighlighted ? "ring-2 ring-primary ring-offset-4 ring-offset-background" : ""}`}
      >
        {!isMyMessage && message.sender && (
          <PublicProfileDialog user={senderProfile}>
            <button
              type="button"
              className="mb-2 block w-full truncate pb-1 pr-6 text-left text-xs font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`View ${[
                message.sender.firstName,
                message.sender.lastName,
              ]
                .filter(Boolean)
                .join(" ")}'s profile`}
            >
              {[message.sender.firstName, message.sender.lastName]
                .filter(Boolean)
                .join(" ")}
            </button>
          </PublicProfileDialog>
        )}

        {!message.isDeleted && !isEditing && hasMessageActions && (
          <div
            className={`absolute right-1 z-10 ${
              isBareMedia && !isMyMessage ? "top-6" : "top-1"
            }`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isDeleting}
                  className={`size-7 rounded-lg shadow-none ${
                    isBareMedia
                      ? "bg-black/35 text-white hover:bg-black/55 hover:text-white"
                      : isMyMessage && !isSticker
                      ? "text-primary-foreground/75 hover:bg-primary-foreground/15 hover:text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-label="Message options"
                >
                  <EllipsisVertical className="size-3.5 text-current" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem onClick={() => onReply?.(message)}>
                  <Reply className="size-4" />
                  Reply
                </DropdownMenuItem>

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
          <button
            type="button"
            onClick={() => onReplyClick?.(message.replyTo._id)}
            className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-xs ${
              isMyMessage
                ? "border-primary-foreground/50 bg-primary-foreground/10"
                : "border-primary/50 bg-muted"
            }`}
          >
            <p className="truncate text-left font-semibold opacity-80">
              {getSenderName(message.replyTo.sender)}
            </p>
            <p className="truncate text-left opacity-70">
              {getReplyPreview(message.replyTo)}
            </p>
          </button>
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
                overlayControls={isBareImage}
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

        <div
          className={
            isBareGif
              ? "absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-2 pt-7"
              : `flex items-center justify-end gap-1.5 ${
                  isBareImage
                    ? "mt-1 px-1"
                    : "mt-2 pt-1"
                }`
          }
        >
          {!message.isDeleted && !isEditing && !isMyMessage && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={isReacting}
              onClick={() => onReact?.(message)}
              className={`size-6 rounded-md shadow-none ${
                isBareGif
                  ? "text-white/85 hover:bg-white/15 hover:text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-label="React to message"
            >
              <Smile className="size-3.5" />
            </Button>
          )}

          {message.isEdited && !message.isDeleted && (
            <span
              className={`text-[10px] ${
                isBareGif
                  ? "text-white/80"
                  : isBareImage
                    ? "text-muted-foreground"
                  : isMyMessage && !isSticker
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              edited
            </span>
          )}

          <span
            className={`text-[10px] sm:text-[11px] ${
              isBareGif
                ? "text-white/85"
                : isBareImage
                  ? "text-muted-foreground"
                : isMyMessage && !isSticker
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            }`}
          >
            {formattedTime}
          </span>

          {receiptStatus && (
            <ReceiptIndicator
              message={message}
              receiptStatus={receiptStatus}
              isGroup={showSender}
              isSticker={isSticker}
              isGifOverlay={isBareGif}
              usePlainColors={isBareImage}
            />
          )}
        </div>
      </div>
      {!message.isDeleted && message.reactions?.length > 0 && (
        <div className="mt-1 flex max-w-[86%] flex-wrap gap-1 sm:max-w-[72%]">
          {message.reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              type="button"
              disabled={isReacting}
              onClick={() => setSelectedReaction(reaction)}
              className={`flex h-7 items-center gap-1 rounded-full border px-2 text-xs shadow-sm transition-colors hover:bg-muted ${
                hasUserReacted(message.reactions, reaction.emoji, authUserId)
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "bg-background text-foreground"
              }`}
              aria-label={`${reaction.emoji}, ${reaction.users.length} reactions. View who reacted.`}
            >
              <span>{reaction.emoji}</span>
              <span className="font-medium">{reaction.users.length}</span>
            </button>
          ))}
        </div>
      )}
      </div>

      <ReactionDetailsDialog
        reaction={selectedReaction}
        open={Boolean(selectedReaction)}
        onOpenChange={(open) => { if (!open) setSelectedReaction(null); }}
      />
    </div>
  );
}

function hasUserReacted(reactions = [], emoji, userId) {
  return Boolean(reactions.find((reaction) => reaction.emoji === emoji)?.users
    ?.some((user) => (user?._id || user) === userId));
}

function ReactionDetailsDialog({ reaction, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{reaction?.emoji}</span>
            Reactions
          </DialogTitle>
          <DialogDescription>
            {reaction?.users?.length || 0} {(reaction?.users?.length || 0) === 1 ? "person" : "people"} reacted.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {(reaction?.users || []).map((user) => {
            const name = getSenderName(user);
            return (
              <div key={user._id || user} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/60">
                <Avatar className="size-9">
                  <AvatarImage src={user.profilePic?.url || user.profilePic} alt={name} />
                  <AvatarFallback>{getInitials(user)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name}</p>
                  {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getInitials(user) {
  if (!user || typeof user === "string") return "?";
  return [user.firstName, user.lastName].filter(Boolean).map((part) => part[0]).join("").toUpperCase() || "?";
}

function getSenderName(sender) {
  if (!sender || typeof sender === "string") return "Unknown sender";
  return [sender.firstName, sender.lastName].filter(Boolean).join(" ") || "Unknown sender";
}

function ReceiptIndicator({
  message,
  receiptStatus,
  isGroup,
  isSticker,
  isGifOverlay,
  usePlainColors,
}) {
  const indicatorClass = `flex items-center gap-0.5 text-[10px] sm:text-[11px] ${
    isGifOverlay
      ? "text-white/85"
      : usePlainColors
        ? "text-muted-foreground"
      : isSticker
        ? "text-muted-foreground"
        : "text-primary-foreground/75"
  }`;
  const indicator = (
    <>
      {receiptStatus.status === "sent" ? (
        <Check className="size-3.5" />
      ) : (
        <CheckCheck
          className={`size-3.5 ${
            receiptStatus.status === "read" ? "text-sky-300" : ""
          }`}
        />
      )}
      {isGroup && receiptStatus.label && <span>{receiptStatus.label}</span>}
    </>
  );

  if (!isGroup) {
    return (
      <span
        className={indicatorClass}
        title={receiptStatus.title}
        aria-label={receiptStatus.title}
      >
        {indicator}
      </span>
    );
  }

  const senderId = message.sender?._id || message.sender;
  const readUsers = getReceiptUsers(message.readBy, senderId);
  const readUserIds = new Set(readUsers.map((user) => user._id));
  const deliveredUsers = getReceiptUsers(message.deliveredBy, senderId).filter(
    (user) => !readUserIds.has(user._id),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`${indicatorClass} rounded px-0.5 outline-none hover:bg-primary-foreground/10 focus-visible:ring-1 focus-visible:ring-current`}
          title="View group message info"
          aria-label="View who has read this message"
        >
          {indicator}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-64 p-2">
        <ReceiptUserList
          title="Read by"
          users={readUsers}
          emptyText="No one has read this message yet."
          accent
        />
        {deliveredUsers.length > 0 && (
          <ReceiptUserList title="Delivered to" users={deliveredUsers} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getSenderProfile(sender) {
  if (!sender || typeof sender === "string") return null;

  const name = [sender.firstName, sender.lastName].filter(Boolean).join(" ");
  const initials = `${sender.firstName?.charAt(0) || ""}${
    sender.lastName?.charAt(0) || ""
  }`.toUpperCase();

  return {
    ...sender,
    id: sender._id,
    userId: sender._id,
    name: name || "Unknown user",
    initials: initials || "U",
    image:
      typeof sender.profilePic === "string"
        ? sender.profilePic
        : sender.profilePic?.url || "",
    online: sender.isOnline || false,
    isGroup: false,
  };
}

function ReceiptUserList({ title, users, emptyText, accent = false }) {
  return (
    <div className="p-1">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{title}</p>
      {users.length > 0 ? (
        <div className="space-y-1">
          {users.map((user) => (
            <div key={user._id} className="flex items-center gap-2 rounded-md px-1 py-1">
              <span
                className={`flex size-5 items-center justify-center rounded-full ${
                  accent ? "bg-sky-500/15 text-sky-600" : "bg-muted text-muted-foreground"
                }`}
              >
                <CheckCheck className="size-3" />
              </span>
              <span className="truncate text-xs text-foreground">
                {formatReceiptUserName(user)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function getReceiptUsers(receipts = [], senderId) {
  const usersById = new Map();

  for (const receipt of receipts) {
    const user = receipt.user;
    const userId = user?._id || user;
    if (!userId || userId === senderId || usersById.has(userId)) continue;

    usersById.set(
      userId,
      typeof user === "object" ? user : { _id: userId },
    );
  }

  return [...usersById.values()];
}

function formatReceiptUserName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Group member";
}

function getReceiptStatus(message, participantCount) {
  const senderId = message.sender?._id || message.sender;
  const recipientCount = Math.max(participantCount - 1, 1);
  const readCount = countOtherReceipts(message.readBy, senderId);
  const deliveredCount = countOtherReceipts(message.deliveredBy, senderId);

  if (readCount > 0) {
    return {
      status: "read",
      title:
        recipientCount > 1
          ? `Read by ${readCount} of ${recipientCount}`
          : "Read",
      label: recipientCount > 1 ? `${readCount}/${recipientCount}` : "",
    };
  }

  if (deliveredCount > 0) {
    return {
      status: "delivered",
      title:
        recipientCount > 1
          ? `Delivered to ${deliveredCount} of ${recipientCount}`
          : "Delivered",
      label: recipientCount > 1 ? `${deliveredCount}/${recipientCount}` : "",
    };
  }

  return { status: "sent", title: "Sent", label: "" };
}

function countOtherReceipts(receipts = [], senderId) {
  return new Set(
    receipts
      .map((receipt) => receipt.user?._id || receipt.user)
      .filter((userId) => userId && userId !== senderId),
  ).size;
}

