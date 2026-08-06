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

export const translationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    code: "TRANSLATION_RATE_LIMITED",
    message:
      "Too many translation requests. Please wait a minute and try again.",
  },
});
