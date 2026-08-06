import mongoose from "mongoose";

const readReceiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Attachment URL is required"],
      trim: true,
    },

    publicId: {
      type: String,
      required: [true, "Attachment public ID is required"],
      trim: true,
    },

    originalName: {
      type: String,
      required: [true, "Attachment filename is required"],
      trim: true,
      maxlength: [255, "Attachment filename cannot exceed 255 characters"],
    },

    mimeType: {
      type: String,
      required: [true, "Attachment MIME type is required"],
      trim: true,
    },

    size: {
      type: Number,
      required: [true, "Attachment size is required"],
      min: [1, "Attachment cannot be empty"],
    },

    resourceType: {
      type: String,
      required: [true, "Attachment resource type is required"],
      enum: {
        values: ["image", "video", "raw"],
        message: "{VALUE} is not a valid Cloudinary resource type",
      },
    },

    width: {
      type: Number,
      default: null,
      min: [0, "Attachment width cannot be negative"],
    },

    height: {
      type: Number,
      default: null,
      min: [0, "Attachment height cannot be negative"],
    },

    duration: {
      type: Number,
      default: null,
      min: [0, "Attachment duration cannot be negative"],
    },
  },
  {
    _id: false,
  },
);

const gifSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["giphy"],
      required: true,
    },
    providerId: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    previewUrl: {
      type: String,
      required: true,
      trim: true,
    },
    width: {
      type: Number,
      required: true,
      min: 1,
    },
    height: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: "GIF",
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false },
);

const externalMediaSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["giphy"],
      required: true,
    },
    providerId: {
      type: String,
      required: true,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["gif", "sticker"],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    previewUrl: {
      type: String,
      required: true,
      trim: true,
    },
    width: {
      type: Number,
      required: true,
      min: 1,
    },
    height: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message sender is required"],
    },

    /*
     * Text for normal messages or an optional caption for attachments.
     */
    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    messageType: {
      type: String,
      enum: {
        values: [
          "text",
          "image",
          "video",
          "audio",
          "file",
          "gif",
          "sticker",
        ],
        message: "{VALUE} is not a valid message type",
      },
      default: "text",
    },

    attachment: {
      type: attachmentSchema,
      default: null,
    },

    gif: {
      type: gifSchema,
      default: null,
    },

    externalMedia: {
      type: externalMediaSchema,
      default: null,
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    readBy: {
      type: [readReceiptSchema],
      default: [],
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.pre("validate", function validateMessage() {
  if (this.isDeleted) {
    return;
  }

  const hasContent =
    typeof this.content === "string" && this.content.trim().length > 0;

  const hasAttachment = Boolean(
    this.attachment?.url && this.attachment?.publicId,
  );

  const hasGif = Boolean(this.gif?.providerId && this.gif?.url);
  const hasExternalMedia = Boolean(
    this.externalMedia?.providerId && this.externalMedia?.url,
  );

  if (this.messageType === "text") {
    if (!hasContent) {
      this.invalidate("content", "Text message content is required");
    }

    if (hasAttachment) {
      this.invalidate(
        "attachment",
        "A text message cannot contain an attachment",
      );
    }

    return;
  }

  if (this.messageType === "gif" || this.messageType === "sticker") {
    if (!hasGif && !hasExternalMedia) {
      this.invalidate(
        "externalMedia",
        "External media metadata is required for GIF and sticker messages",
      );
    }

    if (hasAttachment) {
      this.invalidate(
        "attachment",
        "A GIF or sticker message cannot contain an upload",
      );
    }

    if (
      hasExternalMedia &&
      this.externalMedia.mediaType !== this.messageType
    ) {
      this.invalidate(
        "externalMedia.mediaType",
        "External media type must match the message type",
      );
    }

    return;
  }

  if (!hasAttachment) {
    this.invalidate(
      "attachment",
      "Attachment metadata is required for multimedia messages",
    );
  }
});

messageSchema.index({
  conversation: 1,
  createdAt: -1,
});

messageSchema.index({
  sender: 1,
  createdAt: -1,
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
