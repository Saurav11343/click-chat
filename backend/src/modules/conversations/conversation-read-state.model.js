import mongoose from "mongoose";

const conversationReadStateSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReadAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

conversationReadStateSchema.index(
  { conversation: 1, user: 1 },
  { unique: true },
);

const ConversationReadState = mongoose.model(
  "ConversationReadState",
  conversationReadStateSchema,
);

export default ConversationReadState;
