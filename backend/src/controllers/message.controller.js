import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

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

    await message.populate("sender", "_id firstName lastName profilePic");

    if (message.replyTo) {
      await message.populate({
        path: "replyTo",
        select: "_id content sender messageType createdAt",
        populate: {
          path: "sender",
          select: "_id firstName lastName profilePic",
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
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
      .populate("sender", "_id firstName lastName profilePic")
      .populate({
        path: "replyTo",
        select: "_id content sender messageType createdAt",
        populate: {
          path: "sender",
          select: "_id firstName lastName profilePic",
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
