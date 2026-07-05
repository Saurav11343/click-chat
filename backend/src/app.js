import express from "express";
import cors from "cors";
import ENV from "./config/env.js";

import nameRoute from "./routes/name.route.js";
import authRoute from "./routes/auth.route.js";

const app = express();

app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/name", nameRoute);
app.use("/api/auth", authRoute);

export default app;
