import { useState } from "react";
import { Download, FileText, ImageOff } from "lucide-react";

export function AttachmentContent({ message, isMyMessage, conversationId }) {
  const { attachment, messageType } = message;
  const accessUrl = getAttachmentAccessUrl(conversationId, message._id);
  const externalMedia = message.externalMedia || message.gif;

  if (
    (messageType === "gif" || messageType === "sticker") &&
    externalMedia?.url
  ) {
    return (
      <ExternalMediaAttachment
        media={externalMedia}
        isSticker={messageType === "sticker"}
      />
    );
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

function ExternalMediaAttachment({ media, isSticker }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="rounded-lg border border-current/15 p-3 text-sm opacity-75">
        {isSticker ? "Sticker" : "GIF"} unavailable
      </div>
    );
  }

  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className={isSticker ? "block" : "block overflow-hidden rounded-xl"}
      aria-label={`Open ${isSticker ? "sticker" : "GIF"}`}
    >
      <img
        src={media.url}
        alt={media.description || (isSticker ? "Sticker" : "GIF")}
        loading="lazy"
        onError={() => setHasError(true)}
        className={
          isSticker
            ? "max-h-56 max-w-56 object-contain"
            : "max-h-80 w-full min-w-44 rounded-xl object-contain"
        }
        style={{ aspectRatio: `${media.width} / ${media.height}` }}
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
          <p className="truncate text-sm font-medium">{attachment.originalName}</p>
          <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
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

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

