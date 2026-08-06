import mongoose from "mongoose";

const translationUsageSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, unique: true, index: true },
    charactersUsed: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("TranslationUsage", translationUsageSchema);
