import { success } from "zod";
import User from "../models/user.model.js";
import upload from "../middleware/upload.middleware.js";
import {
  deleteCloudinaryFile,
  uploadProfilePicture,
} from "../services/cloudinary.service.js";
import { searchUsersValidation } from "../validations/user.validation.js";
import { searchUsersService } from "../services/user.service.js";

export const updateProfilePicture = async (req, res) => {
  let newUpload = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Profile picture must be an image",
      });
    }

    const user = await User.findById(req.user._id).select(
      "+profilePic.publicId +profilePic.resourceType",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not Found",
      });
    }

    const oldFile = {
      publicId: user.profilePic?.publicId,
      resourceType: user.profilePic?.resourceType || "image",
    };

    newUpload = await uploadProfilePicture({
      buffer: req.file.buffer,
      userId: user._id.toString(),
    });

    user.profilePic = {
      url: newUpload.secure_url,
      publicId: newUpload.public_id,
      resourceType: newUpload.resource_type,
    };

    await user.save();

    if (oldFile.publicId && oldFile.publicId !== newUpload.public_id) {
      try {
        await deleteCloudinaryFile(oldFile);
      } catch (deleteError) {
        console.error("Old  profile picture deletion failed:", deleteError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);

    if (newUpload?.public_id) {
      try {
        await deleteCloudinaryFile({
          publicId: newUpload.public_id,
          resourceType: newUpload.resource_type || "image",
        });
      } catch (cleanupError) {
        console.error("uploaded file cleanup failed: ", cleanupError);
      }
    }
    return res.status(500).json({
      success: false,
      message: "Unable to upload profile picture",
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const users = await searchUsersService({
      query: req.query.q,
      currentUserId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message:
        users.length > 0 ? "Users found successfully." : "No users found.",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search users.",
    });
  }
};
