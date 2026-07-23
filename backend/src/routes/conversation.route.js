import express from "express";
import { getConversations } from "../controllers/conversation.controller.js";
import { getMessages, sendMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  conversationIdSchema,
  sendMessageSchema,
} from "../validations/message.validation.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getConversations);

router.get(
  "/:conversationId/messages",
  validate(conversationIdSchema, "params"),
  getMessages,
);

router.post(
  "/:conversationId/messages",
  validate(conversationIdSchema, "params"),
  validate(sendMessageSchema),
  sendMessage,
);

export default router;
