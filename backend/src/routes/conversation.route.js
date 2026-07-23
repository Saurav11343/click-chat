import express from "express";
import { getConversations } from "../controllers/conversation.controller.js";
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  conversationIdSchema,
  sendMessageSchema,
  messageParamsSchema,
  editMessageSchema,
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

router.patch(
  "/:conversationId/messages/:messageId",
  validate(messageParamsSchema, "params"),
  validate(editMessageSchema),
  editMessage,
);

router.delete(
  "/:conversationId/messages/:messageId",
  validate(messageParamsSchema, "params"),
  deleteMessage,
);

export default router;
