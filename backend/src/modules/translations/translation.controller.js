import Message from "../messages/message.model.js";
import { translateMessageContent } from "./translation.service.js";
import { findConversationForParticipant } from "../conversations/conversation-access.service.js";

export const translateMessage = async (req, res) => {
  try {
    const conversation = await findConversationForParticipant({
      conversationId: req.params.conversationId,
      userId: req.user._id,
    }).select("_id");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const message = await Message.findOne({
      _id: req.params.messageId,
      conversation: conversation._id,
      isDeleted: false,
    }).select("content");

    if (!message?.content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "This message has no text to translate.",
      });
    }

    const targetLanguage = req.user.preferredLanguage || "en";
    const translation = await translateMessageContent({
      messageId: message._id,
      content: message.content,
      targetLanguage,
    });

    return res.status(200).json({
      success: true,
      translation: {
        text: translation.translatedText,
        targetLanguage,
        detectedSourceLanguage: translation.detectedSourceLanguage,
        cached: translation.cached,
      },
    });
  } catch (error) {
    console.error("Translate message error:", error.message);

    return res.status(error.statusCode || 502).json({
      success: false,
      code: error.code,
      period: error.period,
      message: error.message || "Unable to translate this message.",
    });
  }
};
