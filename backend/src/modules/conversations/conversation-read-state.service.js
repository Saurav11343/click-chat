import ConversationReadState from "./conversation-read-state.model.js";
import { publishToUser } from "../../realtime/event-publisher.js";

export const incrementUnreadForRecipients = async ({
  conversation,
  senderId,
}) => {
  const recipientIds = conversation.participants.filter(
    (participantId) => participantId.toString() !== senderId.toString(),
  );

  await Promise.all(
    recipientIds.map(async (userId) => {
      const state = await ConversationReadState.findOneAndUpdate(
        { conversation: conversation._id, user: userId },
        { $inc: { unreadCount: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      publishToUser(userId, "conversation:unread", {
        conversationId: conversation._id.toString(),
        unreadCount: state.unreadCount,
      });
    }),
  );
};

export const resetUnreadForUser = async ({ conversationId, userId }) => {
  const state = await ConversationReadState.findOneAndUpdate(
    { conversation: conversationId, user: userId },
    { $set: { unreadCount: 0, lastReadAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  publishToUser(userId, "conversation:unread", {
    conversationId: conversationId.toString(),
    unreadCount: 0,
  });

  return state;
};
