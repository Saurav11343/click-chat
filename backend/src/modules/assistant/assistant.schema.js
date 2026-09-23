import { z } from "zod";

export const assistantSchema = z
  .object({
    mode: z.enum(["summary", "chats", "web"]),
    query: z.string().trim().min(1).max(1000),
    conversationId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),
    since: z.string().datetime().optional(),
    // Only previous questions are accepted; previous answers are never trusted as evidence.
    history: z.array(z.string().trim().min(1).max(1000)).max(4).default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.mode === "summary" && !value.conversationId) {
      ctx.addIssue({
        code: "custom",
        path: ["conversationId"],
        message: "Choose a conversation to summarize.",
      });
    }
    if (
      value.mode === "web" &&
      (value.conversationId || value.since || value.history.length)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["mode"],
        message: "Web search accepts only your current query.",
      });
    }
  });
