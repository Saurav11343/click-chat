import mongoose from "mongoose";

import Conversation from "../../modules/conversations/conversation.model.js";
import { publishToUser } from "../event-publisher.js";

const emitTypingUpdate = async ({ socket, conversationId, isTyping }) => {
  try {
    if (
      typeof conversationId !== "string" ||
      !mongoose.isValidObjectId(conversationId)
    ) {
      return;
    }

    const userId = socket.user._id.toString();
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).select("participants");

    if (!conversation) {
      return;
    }

    const payload = {
      conversationId: conversation._id.toString(),
      userId,
      firstName: socket.user.firstName,
      isTyping,
    };

    for (const participantId of conversation.participants) {
      if (participantId.toString() !== userId) {
        publishToUser(participantId, "typing:update", payload);
      }
    }
  } catch (error) {
    console.error("Failed to emit typing update:", error.message);
  }
};

export const registerTypingHandlers = (socket) => {
  socket.on("typing:start", (payload = {}) =>
    emitTypingUpdate({
      socket,
      conversationId: payload.conversationId,
      isTyping: true,
    }),
  );

  socket.on("typing:stop", (payload = {}) =>
    emitTypingUpdate({
      socket,
      conversationId: payload.conversationId,
      isTyping: false,
    }),
  );
};
