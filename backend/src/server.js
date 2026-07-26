import { createServer } from "node:http";

import app from "./app.js";
import connectDB from "./config/db.js";
import ENV from "./config/env.js";

import { initializeSocket } from "./socket/socket.js";

const startServers = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);
    initializeSocket(httpServer);

    httpServer.listen(ENV.PORT, () => {
      console.log(`Server is running on port ${ENV.PORT}`);
    });
  } catch (error) {
    console.error("Failed to Start Server:", error);
    process.exit(1);
  }
};

startServers();
