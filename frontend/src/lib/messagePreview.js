export function getMessagePreview(
  message,
  fallback = "Conversation created. Say hello!",
) {
  if (!message) {
    return fallback;
  }

  if (message.isDeleted) {
    return "Message deleted";
  }

  const content =
    typeof message.content === "string" ? message.content.trim() : "";

  if (content) {
    return content;
  }

  switch (message.messageType) {
    case "image":
      return "📷 Photo";
    case "video":
      return "🎥 Video";
    case "audio":
      return "🎵 Audio";
    case "file":
      return message.attachment?.originalName
        ? `📄 ${message.attachment.originalName}`
        : "📄 Document";
    case "gif":
      return "GIF";
    case "sticker":
      return "Sticker";
    default:
      return fallback;
  }
}
