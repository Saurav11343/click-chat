import Message from "./message.model.js";
import { findConversationForParticipant } from "../conversations/conversation-access.service.js";
import { incrementUnreadForRecipients } from "../conversations/conversation-read-state.service.js";
import {
  presentAndPublishNewMessage,
  validateReplyTarget,
} from "./message-command.service.js";

export const sendExternalMedia = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { conversationId } = req.params;
    const {
      providerId,
      mediaType,
      url,
      previewUrl,
      width,
      height,
      description,
      replyTo,
    } = req.body;

    const conversation = await findConversationForParticipant({
      conversationId,
      userId: senderId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant.",
      });
    }

    await validateReplyTarget({ conversationId, replyTo });

    const externalMedia = {
      provider: "giphy",
      providerId,
      mediaType,
      url,
      previewUrl,
      width,
      height,
      description,
    };
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      messageType: mediaType,
      externalMedia,
      replyTo: replyTo || null,
      readBy: [{ user: senderId, readAt: new Date() }],
    });

    conversation.lastMessage = message._id;
    await conversation.save();
    await incrementUnreadForRecipients({ conversation, senderId });
    const payload = await presentAndPublishNewMessage({
      conversation,
      senderId,
      message,
      logContext: "External media message",
    });

    return res.status(201).json({
      success: true,
      message: `${mediaType === "sticker" ? "Sticker" : "GIF"} sent successfully.`,
      data: payload,
    });
  } catch (error) {
    console.error("Send GIF error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to send GIF.",
    });
  }
};
