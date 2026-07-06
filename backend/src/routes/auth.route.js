import express from "express";
import { checkAuth, login, register } from "../controllers/auth.controller.js";

import { registerSchema, loginSchema } from "../validations/auth.validation.js";

import { validate } from "../middleware/validate.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/check", protectRoute, checkAuth);

export default router;
