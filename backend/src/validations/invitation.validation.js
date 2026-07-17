import { z } from "zod";
import Invitation from "../models/invitation.model.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

export const sendInvitationSchema = z.object({
  recipientId: objectIdSchema,
});

export const invitationIdSchema = z.object({
  invitationId: objectIdSchema,
});

export const invitationActionSchema = z.object({
  action: z.enum(["accepted", "declined"], {
    message: "Action must be accepted or declined",
  }),
});
