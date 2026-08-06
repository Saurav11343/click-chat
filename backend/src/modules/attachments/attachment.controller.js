import Message from "../messages/message.model.js";

import {
  createPrivateAttachmentUrl,
  deleteCloudinaryFile,
  uploadChatAttachment,
} from "../../integrations/cloudinary/cloudinary.service.js";
import { sendMessagePushNotifications } from "../notifications/push-notification.service.js";
import { populateMessage } from "../messages/message.presenter.js";
import { publishToOtherParticipants } from "../../realtime/event-publisher.js";
import { findConversationForParticipant } from "../conversations/conversation-access.service.js";
import { incrementUnreadForRecipients } from "../conversations/conversation-read-state.service.js";

const removeUploadedAttachment = async (attachment) => {
  if (!attachment?.publicId) {
    return;
  }

  try {
    await deleteCloudinaryFile({
      publicId: attachment.publicId,
      resourceType: attachment.resourceType,
    });
  } catch (cleanupError) {
    console.error("Attachment cleanup failed:", cleanupError);
  }
};

export const sendAttachment = async (req, res) => {
  let uploadedAttachment = null;
  let createdMessage = null;
  let isPersisted = false;

  try {
    const senderId = req.user._id;
    const { conversationId } = req.params;

    const { buffer, originalName, mimeType, content, replyTo } =
      req.validatedAttachment;

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

    const uploadResult = await uploadChatAttachment({
      buffer,
      conversationId,
      originalFilename: originalName,
      mimeType,
    });

    uploadedAttachment = uploadResult.attachment;

    createdMessage = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType: uploadResult.messageType,
      attachment: uploadedAttachment,
      replyTo: replyTo || null,
      readBy: [
        {
          user: senderId,
          readAt: new Date(),
        },
      ],
    });

    conversation.lastMessage = createdMessage._id;

    await conversation.save();

    await incrementUnreadForRecipients({ conversation, senderId });

    isPersisted = true;

    await populateMessage(createdMessage);

    const messagePayload = createdMessage.toObject({
      flattenObjectIds: true,
    });

    try {
      publishToOtherParticipants({
        conversation,
        senderId,
        event: "message:new",
        payload: messagePayload,
      });
    } catch (socketError) {
      console.error("Attachment socket emission failed:", socketError);
    }

    void sendMessagePushNotifications({
      conversation,
      sender: createdMessage.sender,
      message: createdMessage,
    }).catch((pushError) => {
      console.error("Attachment push notification failed:", pushError.message);
    });

    return res.status(201).json({
      success: true,
      message: "Attachment sent successfully.",
      data: messagePayload,
    });
  } catch (error) {
    console.error("Send attachment error:", error);

    if (!isPersisted) {
      if (createdMessage?._id) {
        try {
          await Message.deleteOne({
            _id: createdMessage._id,
          });
        } catch (rollbackError) {
          console.error("Attachment message rollback failed:", rollbackError);
        }
      }

      await removeUploadedAttachment(uploadedAttachment);
    }

    if (error?.name === "ValidationError") {
      const firstValidationError = Object.values(error.errors || {})[0];

      return res.status(400).json({
        success: false,
        message:
          firstValidationError?.message || "The attachment message is invalid.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to send attachment.",
    });
  }
};

export const accessAttachment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, messageId } = req.params;

    const conversation = await findConversationForParticipant({
      conversationId,
      userId,
    }).select("_id");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant.",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      conversation: conversationId,
      isDeleted: false,
      attachment: { $ne: null },
    }).select("attachment");

    if (!message?.attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found.",
      });
    }

    const signedUrl = createPrivateAttachmentUrl({
      publicId: message.attachment.publicId,
      resourceType: message.attachment.resourceType,
      originalFilename: message.attachment.originalName,
      asAttachment: req.query.download === "1",
    });

    return res.redirect(302, signedUrl);
  } catch (error) {
    console.error("Attachment access error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to access the attachment.",
    });
  }
};
