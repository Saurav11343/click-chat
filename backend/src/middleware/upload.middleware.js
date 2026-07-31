import multer from "multer";

const MEGABYTE = 1024 * 1024;

export const MAX_PROFILE_FILE_SIZE = 5 * MEGABYTE;
export const MAX_CHAT_FILE_SIZE = 10 * MEGABYTE;

export const CHAT_FILE_FIELD = "file";

const storage = multer.memoryStorage();

const profileImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const profileImageFilter = (req, file, callback) => {
  if (!profileImageMimeTypes.has(file.mimetype)) {
    const error = new Error(
      "Profile picture must be a JPEG, PNG, WebP, or GIF image",
    );

    error.code = "UNSUPPORTED_PROFILE_IMAGE";

    callback(error, false);
    return;
  }

  callback(null, true);
};

const profileUpload = multer({
  storage,
  fileFilter: profileImageFilter,
  limits: {
    files: 1,
    fileSize: MAX_PROFILE_FILE_SIZE,
  },
});

const chatUpload = multer({
  storage,
  limits: {
    files: 1,
    fileSize: MAX_CHAT_FILE_SIZE,
  },
});

const chatUploadSingleFile = chatUpload.single(CHAT_FILE_FIELD);

export const uploadChatFile = (req, res, next) => {
  chatUploadSingleFile(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: `File cannot exceed ${MAX_CHAT_FILE_SIZE / MEGABYTE} MB.`,
        });
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Only one file can be uploaded at a time.",
        });
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: `The file field must be named "${CHAT_FILE_FIELD}".`,
        });
      }

      return res.status(400).json({
        success: false,
        message: "The uploaded file could not be processed.",
      });
    }

    next(error);
  });
};

export default profileUpload;
