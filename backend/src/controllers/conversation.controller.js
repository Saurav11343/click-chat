import Conversation from "../models/conversation.model.js";

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate(
        "participants",
        "_id firstName lastName email profilePic bio isOnline lastSeen",
      )
      .populate("createdBy", "_id firstName lastName")
      .populate("groupAdmins", "_id firstName lastName")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully.",
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations.",
    });
  }
};
