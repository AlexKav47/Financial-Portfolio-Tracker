import express from "express";
import mongoose from "mongoose";
import { PriceHistory } from "../models/PriceHistory.js";

const router = express.Router();

// GET /api/price-history/:assetRefId?limit=5
router.get("/:assetRefId", async (req, res) => {
  try {
    const { assetRefId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || "5", 10), 50);

    if (!mongoose.Types.ObjectId.isValid(assetRefId)) {
      return res.status(400).json({ error: "Invalid assetRefId" });
    }

    // Most recent first, then reverse to ascending for chart
    const rows = await PriceHistory.find({ assetRefId })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    const asc = rows.reverse();

    return res.json({
      assetRefId,
      count: asc.length,
      rows: asc.map((r) => ({
        date: r.date,
        close: r.close,
        open: r.open,
        high: r.high,
        low: r.low,
        volume: r.volume,
        currency: r.currency,
        source: r.source,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch price history" });
  }
});

export default router;
