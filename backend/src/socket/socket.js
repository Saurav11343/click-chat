import { Server } from "socket.io";
import { parseCookie  } from "cookie";
import jwt, { decode } from "jsonwebtoken";

import ENV from "../config/env.js";
import User from "../models/user.model.js";

let io;

const authenticateSocket = async (socket, next) => {
  try {
    const cookies = parseCookie (socket.handshake.headers.cookie || "");
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

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    const userRoom = `user:${userId}`;

    socket.join(userRoom);

    console.log(`${socket.user.firstName} connected with socket ${socket.id}`);

    console.log(`${socket.user.firstName} joined room ${userRoom}`);

    socket.on("disconnect", (reason) => {
      console.log(`${socket.user.firstName} disconnected: ${reason}`);
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
