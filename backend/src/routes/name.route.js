import express from "express";
import { showName } from "../controllers/name.controllers.js";

const router = express.Router();

router.post("/", showName);

export default router;
