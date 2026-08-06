import Message from "./message.model.js";
import { sendMessagePushNotifications } from "../notifications/push-notification.service.js";
import { populateMessage } from "./message.presenter.js";
import { publishToOtherParticipants } from "../../realtime/event-publisher.js";
import { findConversationForParticipant } from "../conversations/conversation-access.service.js";
import { incrementUnreadForRecipients } from "../conversations/conversation-read-state.service.js";

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

    if (replyTo) {
      const repliedMessage = await Message.findOne({
        _id: replyTo,
        conversation: conversationId,
        isDeleted: false,
      }).select("_id");

      if (!repliedMessage) {
        return res.status(400).json({
          success: false,
          message: "Reply message was not found in this conversation.",
        });
      }
    }

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
    await populateMessage(message);

    const payload = message.toObject({ flattenObjectIds: true });
    publishToOtherParticipants({
      conversation,
      senderId,
      event: "message:new",
      payload,
    });

    void sendMessagePushNotifications({
      conversation,
      sender: message.sender,
      message,
    }).catch((pushError) => {
      console.error(
        "External media push notification failed:",
        pushError.message,
      );
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
