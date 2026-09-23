import express from "express";
import { rateLimit } from "express-rate-limit";
import ENV from "../../config/env.js";
import { protectRoute } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { assistantSchema } from "./assistant.schema.js";
import { createProviders } from "./assistant.providers.js";
import { assistantRepository } from "./assistant.repository.js";
import { createAssistantService } from "./assistant.service.js";

const router = express.Router();
const ask = createAssistantService({
  repository: assistantRepository,
  providers: createProviders(),
});
const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator: (req) => String(req.user._id),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message },
  });
router.use(protectRoute);
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.get("/status", (req, res) =>
  res.json({
    ai: Boolean(ENV.GEMINI_API_KEY),
    web: Boolean(ENV.TAVILY_API_KEY),
  }),
);
router.post(
  "/ask",
  limiter(60000, 6, "Please wait a minute before asking more questions."),
  limiter(
    86400000,
    60,
    "You have reached today's 60 assistant requests. Please try tomorrow.",
  ),
  validate(assistantSchema),
  asyncHandler(async (req, res) => res.json(await ask(req.user._id, req.body))),
);
export default router;
