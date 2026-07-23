import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

const senderFields = "_id firstName lastName profilePic";

const replyFields = "_id content sender messageType isDeleted createdAt";

const populateMessage = async (message) => {
  await message.populate("sender", senderFields);

  if (message.replyTo) {
    await message.populate({
      path: "replyTo",
      select: replyFields,
      populate: {
        path: "sender",
        select: senderFields,
      },
    });
  }

  return message;
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { conversationId } = req.params;
    const { content, replyTo } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
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

    await populateMessage(message);

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

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).select("_id");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant.",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", senderFields)
      .populate({
        path: "replyTo",
        select: replyFields,
        populate: {
          path: "sender",
          select: senderFields,
        },
      })
      .populate("readBy.user", "_id firstName lastName")
      .sort({
        createdAt: -1,
      })
      .limit(50)
      .lean();

    messages.reverse();

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully.",
      count: messages.length,
      messages,
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

    message.content = "";
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.isEdited = false;
    message.editedAt = null;

    await message.save();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (conversation?.lastMessage?.toString() === messageId) {
      const previousMessage = await Message.findOne({
        conversation: conversationId,
        isDeleted: false,
      })
        .sort({
          createdAt: -1,
        })
        .select("_id");

      conversation.lastMessage = previousMessage?._id || null;

      await conversation.save();
    }

    await populateMessage(message);

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
