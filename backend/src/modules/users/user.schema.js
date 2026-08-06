import { z } from "zod";

export const searchUsersValidation = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Search query must contain at least 2 characters.")
    .max(50, "Search query must not exceed 50 characters."),
});

const nameField = z
  .string()
  .trim()
  .min(2, "Name must contain at least 2 characters.")
  .max(30, "Name must not exceed 30 characters.")
  .regex(/^[A-Za-z]+$/, "Name can only contain letters.");

export const updateProfileValidation = z
  .object({
    firstName: nameField.optional(),
    lastName: nameField.optional(),
    bio: z
      .string()
      .trim()
      .max(150, "Bio must not exceed 150 characters.")
      .optional(),
    preferredLanguage: z
      .enum([
        "en", "hi", "es", "fr", "de", "it", "pt", "ru", "ja", "ko",
        "zh", "ar", "bn", "gu", "mr", "pa", "ta", "te", "ur", "ne",
      ])
      .optional(),
    appearance: z
      .object({
        preset: z.enum([
          "clickchat",
          "ocean",
          "forest",
          "sunset",
          "lavender",
          "midnight",
        ]),
        colorMode: z.enum(["light", "dark", "system"]),
      })
      .strict()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one profile field to update.",
  });
