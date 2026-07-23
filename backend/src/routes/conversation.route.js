import express from "express";
import { getConversations } from "../controllers/conversation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getConversations);

export default router;
