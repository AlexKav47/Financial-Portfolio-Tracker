import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { searchAssets } from "../controllers/asset.controller.js";

const router = Router();

router.get("/search", requireAuth, searchAssets);

export default router;
