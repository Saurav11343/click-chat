import { z } from "zod";

export const searchUsersValidation = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Search query must contain at least 2 characters.")
    .max(50, "Search query must not exceed 50 characters."),
});
