import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { listIncome, createIncome, deleteIncome, incomeSummary } from "../controllers/income.controller.js";

const router = Router();

router.get("/", requireAuth, listIncome);
router.get("/summary", requireAuth, incomeSummary); // <-- ADD
router.post("/", requireAuth, createIncome);
router.delete("/:id", requireAuth, deleteIncome);

export default router;
