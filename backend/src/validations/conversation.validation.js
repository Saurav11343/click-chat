import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

const groupNameSchema = z
  .string()
  .trim()
  .min(2, "Group name must contain at least 2 characters.")
  .max(50, "Group name must not exceed 50 characters.");

export const createGroupSchema = z.object({
  groupName: groupNameSchema,
  participantIds: z
    .array(objectIdSchema)
    .min(2, "Select at least two contacts.")
    .max(99, "A group cannot contain more than 100 members.")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Group participants must be unique.",
    }),
});

export const updateGroupSchema = z.object({
  groupName: groupNameSchema,
});

export const addGroupParticipantsSchema = z.object({
  participantIds: z
    .array(objectIdSchema)
    .min(1, "Select at least one contact.")
    .max(99, "A group cannot contain more than 100 members.")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Group participants must be unique.",
    }),
});

export const groupConversationParamsSchema = z.object({
  conversationId: objectIdSchema,
});

export const groupParticipantParamsSchema = z.object({
  conversationId: objectIdSchema,
  participantId: objectIdSchema,
});

export const updateGroupAdminSchema = z.object({
  action: z.enum(["add", "remove"], {
    message: "Admin action must be add or remove.",
  }),
});
