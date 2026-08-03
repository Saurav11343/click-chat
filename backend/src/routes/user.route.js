import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  deletePushSubscription,
  savePushSubscription,
  searchUsers,
  updateProfile,
  updateProfilePicture,
} from "../controllers/user.controller.js";
import {
  searchUsersValidation,
  updateProfileValidation,
} from "../validations/user.validation.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.patch(
  "/profile",
  protectRoute,
  validate(updateProfileValidation),
  updateProfile,
);

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

router.post("/push-subscriptions", protectRoute, savePushSubscription);
router.delete("/push-subscriptions", protectRoute, deletePushSubscription);

export default router;
