import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";

import ENV from "../config/env.js";
import User from "../modules/users/user.model.js";

export const authenticateSocket = async (socket, next) => {
  try {
    const cookies = parseCookie(socket.handshake.headers.cookie || "");
    const token = cookies.jwt;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "_id firstName lastName profilePic",
    );

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    return next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    return next(new Error("Invalid or expired authentication"));
  }
};
