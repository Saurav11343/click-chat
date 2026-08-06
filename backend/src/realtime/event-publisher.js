import { getSocketServer } from "./socket-server.js";

export const userRoom = (userId) => `user:${userId.toString()}`;

export const publishToUser = (userId, event, payload) => {
  getSocketServer().to(userRoom(userId)).emit(event, payload);
};

export const publishToOtherParticipants = ({
  conversation,
  senderId,
  event,
  payload,
}) => {
  for (const participantId of conversation.participants) {
    if (participantId.toString() !== senderId.toString()) {
      publishToUser(participantId, event, payload);
    }
  }
};

