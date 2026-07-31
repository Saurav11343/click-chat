import express from "express";
import {
  checkAuth,
  login,
  logout,
  register,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
} from "../controllers/auth.controller.js";

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema,
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

router.post("/google", validate(googleLoginSchema), googleLogin);

router.patch(
  "/change-password",
  protectRoute,
  validate(changePasswordSchema),
  changePassword,
);

router.post(
  "/forgot-password",
  emailVerificationLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

router.post(
  "/reset-password",
  emailVerificationLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

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
