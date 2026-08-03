import express from "express";

import {
  addGroupParticipants,
  createGroup,
  deleteGroup,
  getConversations,
  leaveGroup,
  removeGroupParticipant,
  updateGroup,
  updateGroupAdmin,
  updateGroupImage,
} from "../controllers/conversation.controller.js";

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
import upload, { uploadChatFile } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import { validateChatAttachment } from "../validations/attachment.validation.js";
import { sendExternalMediaSchema } from "../validations/gif.validation.js";

import {
  conversationIdSchema,
  editMessageSchema,
  messageParamsSchema,
  sendMessageSchema,
} from "../validations/message.validation.js";
import {
  addGroupParticipantsSchema,
  createGroupSchema,
  groupConversationParamsSchema,
  groupParticipantParamsSchema,
  updateGroupAdminSchema,
  updateGroupSchema,
} from "../validations/conversation.validation.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getConversations);

router.post("/groups", validate(createGroupSchema), createGroup);

router.patch(
  "/:conversationId/group",
  validate(groupConversationParamsSchema, "params"),
  validate(updateGroupSchema),
  updateGroup,
);

router.patch(
  "/:conversationId/group/image",
  validate(groupConversationParamsSchema, "params"),
  upload.single("file"),
  updateGroupImage,
);

router.post(
  "/:conversationId/group/participants",
  validate(groupConversationParamsSchema, "params"),
  validate(addGroupParticipantsSchema),
  addGroupParticipants,
);

router.delete(
  "/:conversationId/group/participants/:participantId",
  validate(groupParticipantParamsSchema, "params"),
  removeGroupParticipant,
);

router.patch(
  "/:conversationId/group/admins/:participantId",
  validate(groupParticipantParamsSchema, "params"),
  validate(updateGroupAdminSchema),
  updateGroupAdmin,
);

router.post(
  "/:conversationId/group/leave",
  validate(groupConversationParamsSchema, "params"),
  leaveGroup,
);

router.delete(
  "/:conversationId/group",
  validate(groupConversationParamsSchema, "params"),
  deleteGroup,
);

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
