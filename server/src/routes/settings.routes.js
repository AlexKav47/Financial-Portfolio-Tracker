import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getMySettings, updateMySettings } from "../controllers/settings.controller.js";

const router = Router();

router.get("/me", requireAuth, getMySettings);
router.put("/me", requireAuth, updateMySettings);

export default router;
