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
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    emailVerificationSentAt: {
      type: Date,
      default: null,
      select: false,
    },

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    passwordResetSentAt: {
      type: Date,
      default: null,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
      select: false,
    },

    dateOfBirth: {
      type: Date,
      required: function requireDateOfBirth() {
        return this.authProvider === "local";
      },
    },

    password: {
      type: String,
      required: function requirePassword() {
        return this.authProvider === "local";
      },
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
