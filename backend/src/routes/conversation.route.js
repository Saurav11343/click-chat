import express from "express";

import { getConversations } from "../controllers/conversation.controller.js";

import {
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
} from "../controllers/message.controller.js";

import {
  accessAttachment,
  sendAttachment,
} from "../controllers/attachment.controller.js";
import { sendExternalMedia } from "../controllers/gif.controller.js";
import { translateMessage } from "../controllers/translation.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";
import { translationLimiter } from "../middleware/rateLimit.middleware.js";
import { uploadChatFile } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import { validateChatAttachment } from "../validations/attachment.validation.js";
import { sendExternalMediaSchema } from "../validations/gif.validation.js";

import {
  conversationIdSchema,
  editMessageSchema,
  messageParamsSchema,
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

router.post(
  "/:conversationId/attachments",
  validate(conversationIdSchema, "params"),
  uploadChatFile,
  validateChatAttachment,
  sendAttachment,
);

router.post(
  "/:conversationId/media",
  validate(conversationIdSchema, "params"),
  validate(sendExternalMediaSchema),
  sendExternalMedia,
);

router.get(
  "/:conversationId/messages/:messageId/attachment",
  validate(messageParamsSchema, "params"),
  accessAttachment,
);

router.post(
  "/:conversationId/messages/:messageId/translate",
  translationLimiter,
  validate(messageParamsSchema, "params"),
  translateMessage,
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
