import User from "../users/user.model.js";
import webpush, { isWebPushConfigured } from "../../config/web-push.js";

const invalidSubscriptionStatuses = new Set([404, 410]);

const getMessagePreview = (message) => {
  if (message.content?.trim()) {
    return message.content.trim().slice(0, 160);
  }

  const labels = {
    image: "Sent an image",
    video: "Sent a video",
    audio: "Sent an audio message",
    file: "Sent a file",
    gif: "Sent a GIF",
    sticker: "Sent a sticker",
  };

  return labels[message.messageType] || "Sent a message";
};

const createNotificationPayload = ({ conversation, sender, message }) => {
  const senderName = [sender.firstName, sender.lastName]
    .filter(Boolean)
    .join(" ") || "Someone";
  const isGroup = conversation.type === "group";
  const conversationId = conversation._id.toString();
  const messageId = message._id.toString();
  const preview = getMessagePreview(message);

  return JSON.stringify({
    title: isGroup ? conversation.groupName || "Group message" : senderName,
    body: isGroup ? `${senderName}: ${preview}` : preview,
    conversationId,
    messageId,
    messageType: message.messageType,
    senderName,
    isGroup,
    timestamp: new Date(message.createdAt || Date.now()).getTime(),
    url: `/chat?conversation=${encodeURIComponent(conversationId)}`,
  });
};

export const sendMessagePushNotifications = async ({
  conversation,
  sender,
  message,
}) => {
  if (!isWebPushConfigured) {
    return;
  }

  const recipientIds = conversation.participants.filter(
    (participantId) => participantId.toString() !== sender._id.toString(),
  );

  const recipients = await User.find({
    _id: { $in: recipientIds },
    "pushSubscriptions.0": { $exists: true },
  }).select("pushSubscriptions");

  const payload = createNotificationPayload({ conversation, sender, message });

  await Promise.all(
    recipients.map(async (recipient) => {
      const invalidEndpoints = [];

      await Promise.all(
        recipient.pushSubscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: subscription.keys,
              },
              payload,
            );
          } catch (error) {
            if (invalidSubscriptionStatuses.has(error.statusCode)) {
              invalidEndpoints.push(subscription.endpoint);
              return;
            }

            console.error("Push notification delivery failed:", error.message);
          }
        }),
      );

      if (invalidEndpoints.length > 0) {
        await User.updateOne(
          { _id: recipient._id },
          {
            $pull: {
              pushSubscriptions: { endpoint: { $in: invalidEndpoints } },
            },
          },
        );
      }
    }),
  );
};
