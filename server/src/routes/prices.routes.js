import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getLatestPrice } from "../controllers/prices.controller.js";

const router = Router();

router.get("/latest", requireAuth, getLatestPrice);

export default router;
