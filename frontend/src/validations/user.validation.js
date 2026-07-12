import { z } from "zod";

export const userSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .max(50, "Search query must not exceed 50 characters."),
});
