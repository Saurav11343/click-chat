import mongoose from "mongoose";

const translationDailyUsageSchema = new mongoose.Schema(
  {
    dayKey: { type: String, required: true, unique: true, index: true },
    charactersUsed: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

export default mongoose.model(
  "TranslationDailyUsage",
  translationDailyUsageSchema,
);
