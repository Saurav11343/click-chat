import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import ENV from "./config/env.js";

import nameRoute from "./routes/name.route.js";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import invitationRoute from "./routes/invitation.route.js";
import conversationRoute from "./routes/conversation.route.js";

const app = express();

app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/name", nameRoute);
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/invitations", invitationRoute);
app.use("/api/conversations", conversationRoute);
export default app;
