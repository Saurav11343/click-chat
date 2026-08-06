export function getReplyPreview(replyMessage) {
  if (replyMessage.isDeleted) return "Original message was deleted";
  if (replyMessage.content) return replyMessage.content;

  const previews = {
    image: "Photo",
    video: "Video",
    audio: "Audio",
    gif: "GIF",
    sticker: "Sticker",
  };

  if (replyMessage.messageType === "file") {
    return replyMessage.attachment?.originalName || "Document";
  }

  return previews[replyMessage.messageType] || "Message";
}

