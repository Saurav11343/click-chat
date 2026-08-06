import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

export const conversationIdSchema = z.object({
  conversationId: objectIdSchema,
});

export const messageHistoryQuerySchema = z.object({
  cursor: z.string().trim().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),

  replyTo: objectIdSchema.nullable().optional(),
});

export const messageParamsSchema = z.object({
  conversationId: objectIdSchema,
  messageId: objectIdSchema,
});

export const editMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
});

const singleEmojiSchema = z.string().trim().min(1).max(32).refine((value) => {
  const graphemes = [...new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  }).segment(value)];
  return graphemes.length === 1 &&
    /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20E3]/u.test(value);
}, "Reaction must be a single emoji");

export const toggleReactionSchema = z.object({
  emoji: singleEmojiSchema,
});
