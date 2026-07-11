import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { updateProfilePicture } from "../controllers/user.controller.js";

const router = express.Router();

router.patch(
  "/profilePic",
  protectRoute,
  upload.single("file"),
  updateProfilePicture,
);

export default router;
