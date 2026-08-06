import Conversation from "./conversation.model.js";

export const findConversationForParticipant = ({ conversationId, userId }) =>
  Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

export const findGroupForMember = ({ conversationId, userId }) =>
  Conversation.findOne({
    _id: conversationId,
    type: "group",
    participants: userId,
  });

export const findGroupForAdmin = ({ conversationId, userId }) =>
  Conversation.findOne({
    _id: conversationId,
    type: "group",
    participants: userId,
    groupAdmins: userId,
  });
