import mongoose from "mongoose";

import Conversation from "../../modules/conversations/conversation.model.js";
import { publishToUser, userRoom } from "../event-publisher.js";

const isParticipant = (conversation, userId) =>
  conversation.participants.some(
    (participantId) => participantId.toString() === userId.toString(),
  );

const getConversationForCall = async ({ conversationId, userId }) => {
  if (
    typeof conversationId !== "string" ||
    !mongoose.isValidObjectId(conversationId)
  ) {
    return null;
  }

  return Conversation.findOne({
    _id: conversationId,
    type: "direct",
    participants: userId,
  }).select("participants");
};

const forwardCallEvent = async ({
  socket,
  event,
  payload = {},
  requiredTarget = true,
}) => {
  try {
    const { conversationId, targetUserId, callId } = payload;

    if (
      typeof conversationId !== "string" ||
      typeof targetUserId !== "string" ||
      typeof callId !== "string"
    ) {
      return;
    }

    if (
      !mongoose.isValidObjectId(conversationId) ||
      !mongoose.isValidObjectId(targetUserId)
    ) {
      return;
    }

    const conversation = await getConversationForCall({
      conversationId,
      userId: socket.user._id,
    });

    if (!conversation || !isParticipant(conversation, targetUserId)) {
      return;
    }

    if (requiredTarget && targetUserId === socket.user._id.toString()) {
      return;
    }

    publishToUser(targetUserId, event, {
      ...payload,
      callerUserId: socket.user._id.toString(),
    });
  } catch (error) {
    console.error(`Failed to forward ${event}:`, error.message);
  }
};

export const registerCallHandlers = (socket) => {
  socket.on("call:invite", (payload = {}) =>
    forwardCallEvent({
      socket,
      event: "call:incoming",
      payload: {
        ...payload,
        caller: {
          _id: socket.user._id.toString(),
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          profilePic: socket.user.profilePic,
        },
      },
    }),
  );

  socket.on("call:offer", (payload = {}) =>
    forwardCallEvent({
      socket,
      event: "call:offer",
      payload,
    }),
  );

  socket.on("call:answer", (payload = {}) =>
    forwardCallEvent({
      socket,
      event: "call:answer",
      payload,
    }),
  );

  socket.on("call:ice-candidate", (payload = {}) =>
    forwardCallEvent({
      socket,
      event: "call:ice-candidate",
      payload,
    }),
  );

  socket.on("call:accept", (payload = {}) =>
    forwardCallEvent({
      socket,
      event: "call:accepted",
      payload,
    }),
  );

  socket.on("call:reject", (payload = {}) =>
    forwardCallEvent({
      socket,
      event: "call:rejected",
      payload,
    }),
  );

  socket.on("call:end", (payload = {}) =>
    forwardCallEvent({
      socket,
      event: "call:ended",
      payload,
    }),
  );
};
