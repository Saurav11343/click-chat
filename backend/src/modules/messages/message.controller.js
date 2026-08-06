import Message from "./message.model.js";
import { deleteCloudinaryFile } from "../../integrations/cloudinary/cloudinary.service.js";
import { sendMessagePushNotifications } from "../notifications/push-notification.service.js";
import {
  messagePopulateOptions,
  populateMessage,
} from "./message.presenter.js";
import { publishToOtherParticipants } from "../../realtime/event-publisher.js";
import { findConversationForParticipant } from "../conversations/conversation-access.service.js";
import mongoose from "mongoose";
import { incrementUnreadForRecipients } from "../conversations/conversation-read-state.service.js";

const encodeMessageCursor = (message) =>
  Buffer.from(
    `${new Date(message.createdAt).toISOString()}|${message._id}`,
  ).toString("base64url");

const decodeMessageCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const [createdAtValue, id] = Buffer.from(cursor, "base64url")
      .toString("utf8")
      .split("|");
    const createdAt = new Date(createdAtValue);

    if (Number.isNaN(createdAt.getTime()) || !mongoose.isValidObjectId(id)) {
      return null;
    }

    return { createdAt, id };
  } catch {
    return null;
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { conversationId } = req.params;
    const { content, replyTo } = req.body;

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

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType: "text",
      replyTo: replyTo || null,
      readBy: [
        {
          user: senderId,
          readAt: new Date(),
        },
      ],
    });

    conversation.lastMessage = message._id;

    await conversation.save();

    await incrementUnreadForRecipients({ conversation, senderId });

    await populateMessage(message);

    publishToOtherParticipants({
      conversation,
      senderId,
      event: "message:new",
      payload: message,
    });

    void sendMessagePushNotifications({
      conversation,
      sender: message.sender,
      message,
    }).catch((pushError) => {
      console.error("Message push notification failed:", pushError.message);
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { cursor, limit } = req.validatedQuery;
    const decodedCursor = decodeMessageCursor(cursor);

    if (cursor && !decodedCursor) {
      return res.status(400).json({
        success: false,
        message: "Invalid message history cursor.",
      });
    }

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

    const historyFilter = { conversation: conversationId };

    if (decodedCursor) {
      historyFilter.$or = [
        { createdAt: { $lt: decodedCursor.createdAt } },
        {
          createdAt: decodedCursor.createdAt,
          _id: { $lt: decodedCursor.id },
        },
      ];
    }

    const messages = await Message.find(historyFilter)
      .populate(messagePopulateOptions)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    messages.reverse();

    const nextCursor =
      hasMore && messages.length > 0 ? encodeMessageCursor(messages[0]) : null;

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully.",
      count: messages.length,
      messages,
      pageInfo: { hasMore, nextCursor },
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve messages.",
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const userId = req.user._id;

    const { conversationId, messageId } = req.params;

    const { content } = req.body;

    const conversation = await findConversationForParticipant({
      conversationId,
      userId,
    }).select("participants lastMessage");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant.",
      });
    }
    const message = await Message.findOne({
      _id: messageId,
      conversation: conversationId,
      sender: userId,
      isDeleted: false,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you are not authorized to edit it.",
      });
    }

    if (message.messageType !== "text") {
      return res.status(400).json({
        success: false,
        message: "Only text messages can be edited.",
      });
    }

    if (message.content === content) {
      return res.status(400).json({
        success: false,
        message: "The updated message is unchanged.",
      });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    await populateMessage(message);

    publishToOtherParticipants({
      conversation,
      senderId: userId,
      event: "message:updated",
      payload: message,
    });

    return res.status(200).json({
      success: true,
      message: "Message edited successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Edit message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to edit message.",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;

    const { conversationId, messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      conversation: conversationId,
      sender: userId,
      isDeleted: false,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you are not authorized to delete it.",
      });
    }

    const deletedAttachment = message.attachment
      ? {
          publicId: message.attachment.publicId,
          resourceType: message.attachment.resourceType,
        }
      : null;

    message.content = "";
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.isEdited = false;
    message.editedAt = null;
    message.reactions = [];

    await message.save();

    if (deletedAttachment?.publicId) {
      try {
        await deleteCloudinaryFile(deletedAttachment);
        message.attachment = null;

        await Message.updateOne(
          { _id: message._id },
          { $set: { attachment: null } },
        );
      } catch (attachmentDeleteError) {
        console.error(
          "Deleted message attachment cleanup failed:",
          attachmentDeleteError,
        );
      }
    }

    const conversation = await findConversationForParticipant({
      conversationId,
      userId,
    });

    await populateMessage(message);

    publishToOtherParticipants({
      conversation,
      senderId: userId,
      event: "message:deleted",
      payload: message,
    });

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Delete message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete message.",
    });
  }
};

export const toggleMessageReaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, messageId } = req.params;
    const { emoji } = req.body;

    const conversation = await findConversationForParticipant({
      conversationId,
      userId,
    }).select("participants");

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
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or it has been deleted.",
      });
    }

    if (message.sender.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can only react to messages from other participants.",
      });
    }

    const userIdValue = userId.toString();
    const isRemovingCurrentReaction = message.reactions.some(
      (reaction) => reaction.emoji === emoji && reaction.users.some(
        (reactionUserId) => reactionUserId.toString() === userIdValue,
      ),
    );

    for (const reaction of message.reactions) {
      reaction.users = reaction.users.filter(
        (reactionUserId) => reactionUserId.toString() !== userIdValue,
      );
    }
    message.reactions = message.reactions.filter(
      (reaction) => reaction.users.length > 0,
    );

    if (!isRemovingCurrentReaction) {
      const selectedReaction = message.reactions.find(
        (reaction) => reaction.emoji === emoji,
      );
      if (selectedReaction) selectedReaction.users.push(userId);
      else message.reactions.push({ emoji, users: [userId] });
    }

    await message.save();
    await populateMessage(message);

    publishToOtherParticipants({
      conversation,
      senderId: userId,
      event: "message:reaction",
      payload: message,
    });

    return res.status(200).json({
      success: true,
      message: "Reaction updated.",
      data: message,
    });
  } catch (error) {
    console.error("Toggle message reaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update the reaction.",
    });
  }
};
