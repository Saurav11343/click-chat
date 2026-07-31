import { useState } from "react";

import {
  Check,
  Copy,
  Download,
  EllipsisVertical,
  FileText,
  ImageOff,
  Pencil,
  Play,
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

  const isTextMessage = message.messageType === "text";
  const hasLink = /https?:\/\/\S+/i.test(message.content || "");
  const canCopy = isTextMessage || hasLink;
  const hasMessageActions = canCopy || isMyMessage;

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

  return (
    <div
      className={`group flex ${isMyMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative max-w-[86%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[72%] sm:px-4 ${
          !message.isDeleted && !isEditing && hasMessageActions
            ? "pr-10 sm:pr-10"
            : ""
        } ${
          isMyMessage
            ? "rounded-br-sm bg-primary text-primary-foreground shadow-primary/10"
            : "rounded-bl-sm bg-background ring-1 ring-foreground/8"
        }`}
      >
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
                    isMyMessage
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
            {(message.attachment || message.gif) && (
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
              </div>
            )}
          </>
        )}

        <div className="mt-1.5 flex items-center justify-end gap-1.5">
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

function AttachmentContent({ message, isMyMessage, conversationId }) {
  const { attachment, messageType } = message;
  const accessUrl = getAttachmentAccessUrl(conversationId, message._id);

  if (messageType === "gif" && message.gif?.url) {
    return <GifAttachment gif={message.gif} />;
  }

  if (!attachment?.url) {
    return (
      <div className="rounded-lg border border-current/15 p-3 text-sm opacity-75">
        Attachment unavailable
      </div>
    );
  }

  if (messageType === "image") {
    return (
      <ImageAttachment
        attachment={attachment}
        isMyMessage={isMyMessage}
        accessUrl={accessUrl}
      />
    );
  }

  if (messageType === "video") {
    return <VideoAttachment attachment={attachment} accessUrl={accessUrl} />;
  }

  if (messageType === "audio") {
    return (
      <AudioAttachment
        attachment={attachment}
        isMyMessage={isMyMessage}
        accessUrl={accessUrl}
      />
    );
  }

  return (
    <DocumentAttachment
      messageId={message._id}
      conversationId={conversationId}
      attachment={attachment}
      isMyMessage={isMyMessage}
    />
  );
}

function GifAttachment({ gif }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="rounded-lg border border-current/15 p-3 text-sm opacity-75">
        GIF unavailable
      </div>
    );
  }

  return (
    <a
      href={gif.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-xl"
      aria-label="Open GIF"
    >
      <img
        src={gif.url}
        alt={gif.description || "GIF"}
        loading="lazy"
        onError={() => setHasError(true)}
        className="max-h-80 w-full min-w-44 rounded-xl object-contain"
        style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
      />
    </a>
  );
}

function ImageAttachment({ attachment, isMyMessage, accessUrl }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <a
        href={accessUrl}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
          isMyMessage
            ? "border-primary-foreground/20 bg-primary-foreground/10"
            : "border-border bg-muted"
        }`}
      >
        <ImageOff className="size-5 shrink-0" />

        <span className="truncate">Image unavailable — open file</span>
      </a>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <a
        href={accessUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${attachment.originalName}`}
        className="block"
      >
        <img
          src={attachment.url}
          alt={attachment.originalName || "Chat attachment"}
          loading="lazy"
          onError={() => setHasError(true)}
          className="max-h-96 w-full min-w-44 rounded-xl object-contain"
        />
      </a>

      <AttachmentDownloadButton
        accessUrl={accessUrl}
        filename={attachment.originalName}
        className="absolute bottom-2 right-2 bg-black/65 text-white hover:bg-black/80"
      />
    </div>
  );
}

function VideoAttachment({ attachment, accessUrl }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        controls
        preload="metadata"
        playsInline
        className="max-h-96 w-full min-w-56 rounded-xl bg-black"
        aria-label={attachment.originalName}
      >
        <source src={attachment.url} type={attachment.mimeType} />
        Your browser does not support video playback.
      </video>

      <AttachmentDownloadButton
        accessUrl={accessUrl}
        filename={attachment.originalName}
        className="absolute right-2 top-2 bg-black/65 text-white hover:bg-black/80"
      />
    </div>
  );
}

function AudioAttachment({ attachment, isMyMessage, accessUrl }) {
  return (
    <div
      className={`min-w-60 rounded-xl p-2 ${
        isMyMessage ? "bg-primary-foreground/10" : "bg-muted"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <p className="min-w-0 flex-1 truncate text-xs opacity-75">
          {attachment.originalName}
        </p>

        <AttachmentDownloadButton
          accessUrl={accessUrl}
          filename={attachment.originalName}
          className="size-7"
        />
      </div>

      <audio
        controls
        preload="metadata"
        className="h-10 w-full"
        aria-label={attachment.originalName}
      >
        <source src={attachment.url} type={attachment.mimeType} />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

function DocumentAttachment({
  messageId,
  conversationId,
  attachment,
  isMyMessage,
}) {
  const accessUrl = getAttachmentAccessUrl(conversationId, messageId);

  return (
    <div
      className={`flex min-w-56 items-center gap-3 rounded-xl border p-3 transition-colors ${
        isMyMessage
          ? "border-primary-foreground/20 bg-primary-foreground/10"
          : "border-border bg-muted"
      }`}
    >
      <a
        href={accessUrl}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open ${attachment.originalName}`}
      >
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
            isMyMessage
              ? "bg-primary-foreground/15"
              : "bg-primary/10 text-primary"
          }`}
        >
          <FileText className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {attachment.originalName}
          </p>

          <p className="text-xs opacity-70">
            {formatFileSize(attachment.size)}
          </p>
        </div>
      </a>

      <a
        href={`${accessUrl}?download=1`}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg opacity-75 transition-colors hover:bg-current/10 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Download ${attachment.originalName}`}
        title={`Download ${attachment.originalName}`}
      >
        <Download className="size-4" />
      </a>
    </div>
  );
}

function AttachmentDownloadButton({ accessUrl, filename, className = "" }) {
  return (
    <a
      href={`${accessUrl}?download=1`}
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg opacity-80 shadow-sm transition-colors hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      aria-label={`Download ${filename}`}
      title={`Download ${filename}`}
    >
      <Download className="size-4" />
    </a>
  );
}

function getAttachmentAccessUrl(conversationId, messageId) {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  const apiBaseUrl = configuredApiUrl ? `${configuredApiUrl}/api` : "/api";

  return `${apiBaseUrl}/conversations/${conversationId}/messages/${messageId}/attachment`;
}

function MessageText({ content }) {
  const parts = splitTextAndUrls(content);

  return (
    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed sm:text-sm">
      {parts.map((part, index) =>
        part.isUrl ? (
          <a
            key={`${part.value}-${index}`}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline decoration-current/60 underline-offset-2 hover:opacity-80"
          >
            {part.value}
          </a>
        ) : (
          <span key={`${part.value}-${index}`}>{part.value}</span>
        ),
      )}
    </p>
  );
}

function YouTubePreview({ content }) {
  const youtubeLink = findYouTubeLink(content);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  if (!youtubeLink) {
    return null;
  }

  return (
    <a
      href={youtubeLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block w-full min-w-60 max-w-sm overflow-hidden rounded-xl border border-current/15 bg-black text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Watch video on YouTube"
    >
      <div className="relative aspect-video w-full bg-zinc-900">
        {!thumbnailFailed && (
          <img
            src={`https://i.ytimg.com/vi/${youtubeLink.videoId}/hqdefault.jpg`}
            alt="YouTube video preview"
            loading="lazy"
            onError={() => setThumbnailFailed(true)}
            className="size-full object-cover"
          />
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-black/10">
          <span className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5">
        <Play className="size-4 shrink-0 fill-red-500 text-red-500" />

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">YouTube video</p>
          <p className="text-xs text-zinc-400">Watch on YouTube</p>
        </div>
      </div>
    </a>
  );
}

function splitTextAndUrls(content) {
  const urlPattern = /(https?:\/\/[^\s<>]+)/gi;

  return String(content)
    .split(urlPattern)
    .filter(Boolean)
    .map((value) => ({
      value,
      isUrl: /^https?:\/\//i.test(value),
    }));
}

function findYouTubeLink(content) {
  const urlMatches = String(content).match(/https?:\/\/[^\s<>]+/gi) || [];

  for (const rawUrl of urlMatches) {
    const cleanedUrl = rawUrl.replace(/[),.!?;:]+$/, "");
    const videoId = getYouTubeVideoId(cleanedUrl);

    if (videoId) {
      return {
        videoId,
        url: cleanedUrl,
      };
    }
  }

  return null;
}

function getYouTubeVideoId(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0];
    } else if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com" ||
      hostname === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else {
        const pathParts = url.pathname.split("/").filter(Boolean);

        if (["shorts", "embed", "live"].includes(pathParts[0])) {
          videoId = pathParts[1];
        }
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId || "") ? videoId : null;
  } catch {
    return null;
  }
}

function getReplyPreview(replyMessage) {
  if (replyMessage.isDeleted) {
    return "Original message was deleted";
  }

  if (replyMessage.content) {
    return replyMessage.content;
  }

  switch (replyMessage.messageType) {
    case "image":
      return "Photo";

    case "video":
      return "Video";

    case "audio":
      return "Audio";

    case "file":
      return replyMessage.attachment?.originalName || "Document";

    case "gif":
      return "GIF";

    default:
      return "Message";
  }
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
