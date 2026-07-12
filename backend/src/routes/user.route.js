import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  searchUsers,
  updateProfilePicture,
} from "../controllers/user.controller.js";
import { searchUsersValidation } from "../validations/user.validation.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.patch(
  "/profilePic",
  protectRoute,
  upload.single("file"),
  updateProfilePicture,
);

router.get(
  "/search",
  protectRoute,
  validate(searchUsersValidation, "query"),
  searchUsers,
);

export default router;
