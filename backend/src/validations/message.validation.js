import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ID",
  );

export const conversationIdSchema = z.object({
  conversationId: objectIdSchema,
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(
      5000,
      "Message cannot exceed 5000 characters",
    ),

  replyTo: objectIdSchema
    .nullable()
    .optional(),
});