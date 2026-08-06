import mongoose from "mongoose";

const messageTranslationSchema = new mongoose.Schema(
  {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
    targetLanguage: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contentHash: { type: String, required: true },
    translatedText: { type: String, required: true },
    detectedSourceLanguage: { type: String, default: "" },
  },
  { timestamps: true },
);

messageTranslationSchema.index(
  { message: 1, targetLanguage: 1, contentHash: 1 },
  { unique: true },
);

export default mongoose.model("MessageTranslation", messageTranslationSchema);
