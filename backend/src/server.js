import { createServer } from "node:http";

import app from "./app.js";
import connectDB from "./config/database.js";
import ENV from "./config/env.js";
import User from "./modules/users/user.model.js";

import { initializeSocket } from "./realtime/index.js";

const startServers = async () => {
  try {
    await connectDB();

    await User.updateMany(
      {
        isOnline: true,
      },
      {
        $set: {
          isOnline: false,
          lastSeen: new Date(),
        },
      },
    );

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
