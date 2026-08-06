import express from "express";

import { accessAttachment, sendAttachment } from "../attachments/attachment.controller.js";
import { sendExternalMedia } from "./external-media.controller.js";
import {
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
} from "./message.controller.js";
import { translateMessage } from "../translations/translation.controller.js";
import { translationLimiter } from "../../middleware/rate-limit.middleware.js";
import { uploadChatFile } from "../../middleware/upload.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { validateChatAttachment } from "../attachments/attachment.schema.js";
import { sendExternalMediaSchema } from "./external-media.schema.js";
import {
  conversationIdSchema,
  editMessageSchema,
  messageParamsSchema,
  sendMessageSchema,
} from "./message.schema.js";

const router = express.Router({ mergeParams: true });

router.get("/:conversationId/messages", validate(conversationIdSchema, "params"), getMessages);
router.post("/:conversationId/messages", validate(conversationIdSchema, "params"), validate(sendMessageSchema), sendMessage);
router.post("/:conversationId/attachments", validate(conversationIdSchema, "params"), uploadChatFile, validateChatAttachment, sendAttachment);
router.post("/:conversationId/media", validate(conversationIdSchema, "params"), validate(sendExternalMediaSchema), sendExternalMedia);
router.get("/:conversationId/messages/:messageId/attachment", validate(messageParamsSchema, "params"), accessAttachment);
router.post("/:conversationId/messages/:messageId/translate", translationLimiter, validate(messageParamsSchema, "params"), translateMessage);
router.patch("/:conversationId/messages/:messageId", validate(messageParamsSchema, "params"), validate(editMessageSchema), editMessage);
router.delete("/:conversationId/messages/:messageId", validate(messageParamsSchema, "params"), deleteMessage);

export default router;
