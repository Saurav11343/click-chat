import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ["direct", "group"],
        message: "{VALUE} is not a valid conversation type",
      },
      default: "direct",
      required: [true, "Conversation type is required"],
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    directKey: {
      type: String,
      trim: true,
      default: null,
    },

    groupName: {
      type: String,
      trim: true,
      minlength: [2, "Group name must be at least 2 characters"],
      maxlength: [50, "Group name cannot exceed 50 characters"],
      default: null,
    },

    groupImage: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
        select: false,
      },

      resourceType: {
        type: String,
        default: "image",
        select: false,
      },
    },
    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Conversation creator is required"],
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.pre("validate", function () {
  const participantIds = this.participants.map((participant) =>
    participant.toString(),
  );

  const uniqueParticipantIds = new Set(participantIds);

  if (uniqueParticipantIds.size !== participantIds.length) {
    this.invalidate("participants", "Conversation participants must be unique");
  }

  if (this.type === "direct" && participantIds.length !== 2) {
    this.invalidate(
      "participants",
      "A direct conversation requires exactly two participants",
    );
  }

  if (this.type === "direct" && !this.directKey) {
    this.invalidate("directKey", "A direct conversation requires a direct key");
  }

  if (this.type === "group" && participantIds.length < 3) {
    this.invalidate(
      "participants",
      "A group conversation requires at least three participants",
    );
  }

  if (this.type === "group" && !this.groupName) {
    this.invalidate("groupName", "Group name is required");
  }

  if (this.type === "group" && this.groupAdmins.length === 0) {
    this.invalidate(
      "groupAdmins",
      "A group conversation requires an administrator",
    );
  }
});

conversationSchema.index(
  {
    directKey: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      type: "direct",
      directKey: {
        $type: "string",
      },
    },
  },
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
