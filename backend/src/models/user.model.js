import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [30, "First name cannot exceed 30 characters"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [30, "Last name cannot exceed 30 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },

    profilePic: {
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

    bio: {
      type: String,
      trim: true,
      maxlength: [150, "Bio cannot exceed 150 characters"],
      default: "Hey there! I am using ChatApp.",
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;