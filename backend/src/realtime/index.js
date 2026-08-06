import { Server } from "socket.io";

import ENV from "../config/env.js";
import { userRoom } from "./event-publisher.js";
import { registerPresenceHandlers } from "./handlers/presence.handler.js";
import { registerTypingHandlers } from "./handlers/typing.handler.js";
import { authenticateSocket } from "./socket-auth.middleware.js";
import { getSocketServer, setSocketServer } from "./socket-server.js";

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [ENV.CLIENT_URL, "http://localhost", "https://localhost"],
      credentials: true,
    },
  });

  setSocketServer(io);
  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    socket.join(userRoom(socket.user._id));
    registerTypingHandlers(socket);
    await registerPresenceHandlers(socket);

    console.log(`${socket.user.firstName} connected with socket ${socket.id}`);
  });

  return io;
};

export const getIO = getSocketServer;
