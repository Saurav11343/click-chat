import express from "express";

import {
  getInvitations,
  respondToInvitation,
  sendInvitation,
  getAcceptedContacts,
} from "./invitation.controller.js";

import { protectRoute } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

import {
  invitationActionSchema,
  invitationIdSchema,
  sendInvitationSchema,
} from "./invitation.schema.js";

const router = express.Router();

router.use(protectRoute);
router.get("/", getInvitations);
router.post("/", validate(sendInvitationSchema), sendInvitation);
router.patch(
  "/:invitationId",
  validate(invitationIdSchema, "params"),
  validate(invitationActionSchema),
  respondToInvitation,
);
router.get("/contacts", getAcceptedContacts);
export default router;
