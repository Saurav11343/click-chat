import { rateLimit } from "express-rate-limit";

export const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many email requests. Please wait 15 minutes and try again.",
  },
});
