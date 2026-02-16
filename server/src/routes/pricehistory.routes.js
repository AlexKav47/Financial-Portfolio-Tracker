import express from "express";
import mongoose from "mongoose";
import { PriceHistory } from "../models/PriceHistory.js";

const router = express.Router();

/**
 * GET /api/price-history/:assetRefId?limit=30
 *
 * Returns the most recent N rows for an asset, ordered ASC by date (for charts).
 * Notes:
 * - We query DESC (fast for "most recent"), then reverse to ASC for chart consumption.
 * - limit is clamped to [1..365].
 */
router.get("/:assetRefId", async (req, res) => {
  try {
    const { assetRefId } = req.params;

    // limit query param (default 30)
    const raw = Number.parseInt(req.query.limit ?? "30", 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 365) : 30;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(assetRefId)) {
      return res.status(400).json({ error: "Invalid assetRefId" });
    }

    // Most recent first, then reverse to ascending for chart
    const rows = await PriceHistory.find({ assetRefId })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    const asc = rows.slice().reverse(); // don't mutate rows in place

    return res.json({
      assetRefId,
      limit,
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
    console.error("[price-history] failed:", err);
    return res.status(500).json({ error: "Failed to fetch price history" });
  }
});

export default router;
