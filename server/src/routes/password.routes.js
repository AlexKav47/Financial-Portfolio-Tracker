import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { changePassword } from "../controllers/password.controller.js";

const router = Router();

router.put("/change", requireAuth, changePassword);

export default router;
