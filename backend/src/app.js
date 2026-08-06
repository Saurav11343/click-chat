import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import ENV from "./config/env.js";

import authRoute from "./modules/auth/auth.route.js";
import userRoute from "./modules/users/user.route.js";
import invitationRoute from "./modules/invitations/invitation.route.js";
import conversationRoute from "./routes/conversation.route.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";

const app = express();

app.use(
  cors({
    origin: [ENV.CLIENT_URL, "http://localhost", "https://localhost"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/invitations", invitationRoute);
app.use("/api/conversations", conversationRoute);

app.use(notFoundHandler);
app.use(errorHandler);
export default app;
