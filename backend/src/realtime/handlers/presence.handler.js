import Conversation from "../../modules/conversations/conversation.model.js";
import User from "../../modules/users/user.model.js";
import { publishToUser } from "../event-publisher.js";

const socketCounts = new Map();
const offlineTimers = new Map();
const OFFLINE_GRACE_PERIOD_MS = 5000;

const getContactIds = async (userId) => {
  const participantIds = await Conversation.distinct("participants", {
    participants: userId,
  });

  return participantIds
    .map(String)
    .filter((participantId) => participantId !== userId);
};

const publishPresence = async ({ userId, isOnline, lastSeen = null }) => {
  const contactIds = await getContactIds(userId);
  const payload = { userId, isOnline, lastSeen };

  for (const contactId of contactIds) {
    publishToUser(contactId, "presence:update", payload);
  }
};

export const registerPresenceHandlers = async (socket) => {
  const userId = socket.user._id.toString();
  const previousCount = socketCounts.get(userId) || 0;
  socketCounts.set(userId, previousCount + 1);

  const existingTimer = offlineTimers.get(userId);
  const wasReconnecting = Boolean(existingTimer);

  if (existingTimer) {
    clearTimeout(existingTimer);
    offlineTimers.delete(userId);
  }

  if (previousCount === 0 && !wasReconnecting) {
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      await publishPresence({ userId, isOnline: true });
    } catch (error) {
      console.error("Failed to update online presence:", error.message);
    }
  }

  socket.on("disconnect", (reason) => {
    console.log(`${socket.user.firstName} disconnected: ${reason}`);

    const remainingCount = Math.max((socketCounts.get(userId) || 0) - 1, 0);
    if (remainingCount > 0) {
      socketCounts.set(userId, remainingCount);
      return;
    }

    socketCounts.delete(userId);
    const timer = setTimeout(async () => {
      try {
        if ((socketCounts.get(userId) || 0) > 0) return;

        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
        await publishPresence({ userId, isOnline: false, lastSeen });
      } catch (error) {
        console.error("Failed to update offline presence:", error.message);
      } finally {
        offlineTimers.delete(userId);
      }
    }, OFFLINE_GRACE_PERIOD_MS);

    offlineTimers.set(userId, timer);
  });
};
