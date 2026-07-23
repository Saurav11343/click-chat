import express from "express";
import {
  checkAuth,
  login,
  logout,
  register,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth.controller.js";

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "../validations/auth.validation.js";

import { validate } from "../middleware/validate.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { emailVerificationLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post(
  "/register",
  emailVerificationLimiter,
  validate(registerSchema),
  register,
);

router.post("/login", validate(loginSchema), login);

router.get("/check", protectRoute, checkAuth);

router.get("/logout", logout);

router.get("/verify-email", validate(verifyEmailSchema, "query"), verifyEmail);

router.post(
  "/resend-verification",
  emailVerificationLimiter,
  validate(resendVerificationSchema),
  resendVerificationEmail,
);

export default router;
