import mongoose from "mongoose";
import ENV from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log("MongoDB Connected!!!");
    console.log(`Database : ${conn.connection.name}`);
  } catch (error) {
    console.error("MongoDb connection Failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
