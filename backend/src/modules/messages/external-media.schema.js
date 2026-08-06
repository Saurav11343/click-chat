import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

const giphyUrlSchema = z.url("Invalid GIPHY media URL").refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    (url.hostname === "giphy.com" || url.hostname.endsWith(".giphy.com"))
  );
}, "GIF media must be hosted by GIPHY");

export const sendExternalMediaSchema = z.object({
  providerId: z.string().trim().min(1).max(100),
  mediaType: z.enum(["gif", "sticker"]),
  url: giphyUrlSchema,
  previewUrl: giphyUrlSchema,
  width: z.number().int().min(1).max(4000),
  height: z.number().int().min(1).max(4000),
  description: z.string().trim().max(300).optional().default("GIF"),
  replyTo: objectIdSchema.nullable().optional(),
});
