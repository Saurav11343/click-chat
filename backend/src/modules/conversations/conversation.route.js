import express from "express";

import {
  clearDirectConversation,
  deleteDirectConversation,
  getConversations,
} from "./conversation.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { conversationIdSchema } from "../messages/message.schema.js";

const router = express.Router({ mergeParams: true });

router.get("/", getConversations);
router.post(
  "/:conversationId/clear",
  validate(conversationIdSchema, "params"),
  clearDirectConversation,
);
router.delete(
  "/:conversationId/direct",
  validate(conversationIdSchema, "params"),
  deleteDirectConversation,
);

export default router;
