import Conversation from "../conversations/conversation.model.js";
import Message from "../messages/message.model.js";

export const assistantRepository = {
  currentMessages(ids) {
    return Message.find({ _id: { $in: ids }, isDeleted: false })
      .select("_id content attachment.originalName messageType").lean();
  },
  conversations(userId, conversationId) {
    return Conversation.find({
      participants: userId,
      ...(conversationId ? { _id: conversationId } : {}),
    })
      .select("_id groupName participants")
      .populate("participants", "firstName lastName")
      .lean();
  },
  messages(filter, limit) {
    return Message.find(filter)
      .select(
        "_id conversation sender content createdAt attachment.originalName messageType",
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .maxTimeMS(5000)
      .populate("sender", "firstName lastName")
      .lean();
  },
};
