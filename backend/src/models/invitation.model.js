import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invitation sender is required"],
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invitation recipient is required"],
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "accepted", "declined"],
        message: "{VALUE} is not a valid invitation status",
      },
      default: "pending",
    },
  },
  { timestamps: true },
);

invitationSchema.index({
  sender: 1,
  recipient: 1,
  status: 1,
});

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
