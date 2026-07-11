import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

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

  // Text and CSV
  "text/plain",
  "text/csv",

  // Video
  "video/mp4",
  "video/webm",
  "video/quicktime",

  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
];

const fileFilter = (req, file, callback) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new Error("This file type is not supported"),
      false
    );
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;