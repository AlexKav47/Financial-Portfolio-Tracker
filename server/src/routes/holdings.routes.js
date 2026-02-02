import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { createHolding, deleteHolding, listHoldings } from "../controllers/holdings.controller.js";

const router = Router();

router.get("/", requireAuth, listHoldings);
router.post("/", requireAuth, createHolding);
router.delete("/:id", requireAuth, deleteHolding);

export default router;
