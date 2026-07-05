import app from "./app.js";
import connectDB from "./config/db.js";
import ENV from "./config/env.js";

const startServers = async () => {
  try {
    await connectDB();

    app.listen(ENV.PORT, () => {
      console.log(`Server is running on port ${ENV.PORT}`);
    });
  } catch (error) {
    console.error("Failed to Start Server:", error);
    process.exit(1);
  }
};

startServers();
