import { z } from "zod";

import { MAX_CHAT_FILE_SIZE } from "../../middleware/upload.middleware.js";

export const ALLOWED_CHAT_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",

  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",

  // PDF
  "application/pdf",

  // Microsoft Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Microsoft Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  // Microsoft PowerPoint
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Plain text and CSV
  "text/plain",
  "text/csv",
];

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid reply message ID");

const uploadedFileSchema = z.object({
  originalname: z
    .string()
    .trim()
    .min(1, "Filename is required")
    .max(255, "Filename cannot exceed 255 characters"),

  mimetype: z
    .string()
    .trim()
    .refine(
      (mimeType) => ALLOWED_CHAT_MIME_TYPES.includes(mimeType),
      "This file type is not supported",
    ),

  size: z
    .number()
    .int("File size must be a whole number")
    .positive("The uploaded file is empty")
    .max(MAX_CHAT_FILE_SIZE, "File cannot exceed 10 MB"),

  buffer: z.instanceof(Buffer, {
    error: "Uploaded file data is missing",
  }),
});

const attachmentFieldsSchema = z.object({
  content: z
    .string()
    .trim()
    .max(5000, "Caption cannot exceed 5000 characters")
    .optional()
    .default(""),

  replyTo: z.preprocess((value) => {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }

    return value;
  }, objectIdSchema.optional()),
});

const attachmentRequestSchema = z.object({
  file: uploadedFileSchema,
  fields: attachmentFieldsSchema,
});

const getFirstValidationMessage = (error) => {
  return error.issues[0]?.message || "Invalid attachment upload";
};

export const validateChatAttachment = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select a file to upload.",
    });
  }

  const result = attachmentRequestSchema.safeParse({
    file: req.file,
    fields: req.body,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: getFirstValidationMessage(result.error),
      errors: result.error.flatten(),
    });
  }

  /*
   * Keep Multer's complete file object because it also contains fields such
   * as fieldname and encoding. Store normalized Zod values separately.
   */
  req.validatedAttachment = {
    originalName: result.data.file.originalname,
    mimeType: result.data.file.mimetype,
    size: result.data.file.size,
    buffer: result.data.file.buffer,
    content: result.data.fields.content,
    replyTo: result.data.fields.replyTo || null,
  };

  next();
};

export const getMessageTypeFromMimeType = (mimeType) => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "file";
};

export const getCloudinaryResourceType = (mimeType) => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
    return "video";
  }

  return "raw";
};
