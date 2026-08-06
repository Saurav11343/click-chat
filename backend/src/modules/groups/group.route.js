import express from "express";

import {
  addGroupParticipants,
  createGroup,
  deleteGroup,
  leaveGroup,
  removeGroupParticipant,
  updateGroup,
  updateGroupAdmin,
  updateGroupImage,
} from "../conversations/conversation.controller.js";
import upload from "../../middleware/upload.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  addGroupParticipantsSchema,
  createGroupSchema,
  groupConversationParamsSchema,
  groupParticipantParamsSchema,
  updateGroupAdminSchema,
  updateGroupSchema,
} from "../conversations/conversation.schema.js";

const router = express.Router({ mergeParams: true });

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

export default router;
