import express, { Router } from "express";

import {
  getInvitations,
  respondToInvitation,
  sendInvitation,
  getAcceptedContacts,
} from "../controllers/invitation.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  invitationActionSchema,
  invitationIdSchema,
  sendInvitationSchema,
} from "../validations/invitation.validation.js";

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
