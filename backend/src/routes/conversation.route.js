import express from "express";

import { protectRoute } from "../middleware/auth.middleware.js";
import conversationRouter from "../modules/conversations/conversation.route.js";
import groupRouter from "../modules/groups/group.route.js";
import messageRouter from "../modules/messages/message.route.js";

const router = express.Router();

router.use(protectRoute);
router.use(conversationRouter);
router.use(groupRouter);
router.use(messageRouter);

export default router;
