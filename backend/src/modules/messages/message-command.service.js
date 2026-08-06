import { AppError } from "../../shared/errors/app-error.js";
import { publishToOtherParticipants } from "../../realtime/event-publisher.js";
import { sendMessagePushNotifications } from "../notifications/push-notification.service.js";
import Message from "./message.model.js";
import { populateMessage } from "./message.presenter.js";

export const validateReplyTarget = async ({ conversationId, replyTo }) => {
  if (!replyTo) return;

  const exists = await Message.exists({
    _id: replyTo,
    conversation: conversationId,
    isDeleted: false,
  });

  if (!exists) {
    throw new AppError(
      "Reply message was not found in this conversation.",
      400,
    );
  }
};

export const presentAndPublishNewMessage = async ({
  conversation,
  senderId,
  message,
  logContext = "Message",
}) => {
  await populateMessage(message);
  const payload = message.toObject({ flattenObjectIds: true });

  try {
    publishToOtherParticipants({
      conversation,
      senderId,
      event: "message:new",
      payload,
    });
  } catch (socketError) {
    console.error(`${logContext} socket emission failed:`, socketError);
  }

  void sendMessagePushNotifications({
    conversation,
    sender: message.sender,
    message,
  }).catch((pushError) => {
    console.error(`${logContext} push notification failed:`, pushError.message);
  });

  return payload;
};

export const applySingleUserReaction = ({ message, userId, emoji }) => {
  const userIdValue = userId.toString();
  const isRemovingCurrentReaction = message.reactions.some(
    (reaction) =>
      reaction.emoji === emoji &&
      reaction.users.some(
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

  if (isRemovingCurrentReaction) return;

  const selectedReaction = message.reactions.find(
    (reaction) => reaction.emoji === emoji,
  );

  if (selectedReaction) selectedReaction.users.push(userId);
  else message.reactions.push({ emoji, users: [userId] });
};
