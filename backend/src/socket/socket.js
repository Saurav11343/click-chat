import { Server } from "socket.io";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";

import ENV from "../config/env.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

let io;

const userSocketsCounts = new Map();
const offlineTimers = new Map();
const OFFLINE_GRACE_PERIOD = 5000;

const getContactIds = async (userId) => {
  const participantIds = await Conversation.distinct("participants", {
    participants: userId,
  });

  return participantIds
    .map((participantId) => participantId.toString())
    .filter((participantId) => participantId !== userId);
};

const emitPresenceUpdate = async ({ userId, isOnline, lastSeen = null }) => {
  const contactIds = await getContactIds(userId);

  const presence = {
    userId,
    isOnline,
    lastSeen,
  };

  for (const contactId of contactIds) {
    io.to(`user:${contactId}`).emit("presence:update", presence);
  }
};

const authenticateSocket = async (socket, next) => {
  try {
    const cookies = parseCookie(socket.handshake.headers.cookie || "");
    const token = cookies.jwt;

    if (!token) {
      return next(new Error("Authentication Required"));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "_id firstName lastName profilePic",
    );

    if (!user) {
      return next(new Error("User not Found"));
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Invalid or Expired authentication"));
  }
};

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ENV.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    const userRoom = `user:${userId}`;

    const previousCount = userSocketsCounts.get(userId) || 0;
    const nextCount = previousCount + 1;

    userSocketsCounts.set(userId, nextCount);

    const existingOfflineTimer = offlineTimers.get(userId);
    const wasReconnecting = Boolean(existingOfflineTimer);

    if (existingOfflineTimer) {
      clearTimeout(existingOfflineTimer);
      offlineTimers.delete(userId);
    }

    if (previousCount === 0 && !wasReconnecting) {
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
        });

        await emitPresenceUpdate({
          userId,
          isOnline: true,
          lastSeen: null,
        });
        console.log(`${socket.user.firstName} is now online`);
      } catch (error) {
        console.error("Failed to update online presence", error);
      }
    }

    socket.join(userRoom);

    console.log(`${socket.user.firstName} connected with socket ${socket.id}`);

    console.log(`${socket.user.firstName} joined room ${userRoom}`);

    socket.on("disconnect", (reason) => {
      console.log(`${socket.user.firstName} disconnected: ${reason}`);

      const currentCount = userSocketsCounts.get(userId) || 0;
      const remainingCount = Math.max(currentCount - 1, 0);

      if (remainingCount > 0) {
        userSocketsCounts.set(userId, remainingCount);
        return;
      }

      userSocketsCounts.delete(userId);

      const offlineTimer = setTimeout(async () => {
        try {
          if ((userSocketsCounts.get(userId) || 0) > 0) {
            return;
          }

          const lastSeen = new Date();

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen,
          });

          await emitPresenceUpdate({
            userId,
            isOnline: false,
            lastSeen,
          });

          console.log(`${socket.user.firstName} is now offline`);
        } catch (error) {
          console.error("Failed to update offline presence:", error);
        } finally {
          offlineTimers.delete(userId);
        }
      }, OFFLINE_GRACE_PERIOD);

      offlineTimers.set(userId, offlineTimer);
    });
  });
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};
