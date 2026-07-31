import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getIO } from "../socket/socket.js";

const senderFields = "_id firstName lastName profilePic";
const replyFields =
  "_id content sender messageType attachment gif externalMedia isDeleted createdAt";

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
    } = req.body;

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
      readBy: [{ user: senderId, readAt: new Date() }],
    });

    conversation.lastMessage = message._id;
    await conversation.save();
    await message.populate("sender", senderFields);

    if (message.replyTo) {
      await message.populate({
        path: "replyTo",
        select: replyFields,
        populate: { path: "sender", select: senderFields },
      });
    }

    const payload = message.toObject({ flattenObjectIds: true });
    const io = getIO();

    for (const participantId of conversation.participants) {
      if (participantId.toString() !== senderId.toString()) {
        io.to(`user:${participantId.toString()}`).emit("message:new", payload);
      }
    }

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
