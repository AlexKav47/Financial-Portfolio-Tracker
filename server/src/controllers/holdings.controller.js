import { Holding } from "../models/Holding.js";

export async function listHoldings(req, res) {
  const holdings = await Holding.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ ok: true, holdings });
}

export async function createHolding(req, res) {
  const { assetRefId, type, symbol, name, quantity, avgBuyPrice } = req.body || {};

  if (!type || !["stock", "crypto"].includes(type)) {
    return res.status(400).json({ error: "type must be 'stock' or 'crypto'" });
  }
  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "symbol is required" });
  }

  const q = Number(quantity);
  const p = Number(avgBuyPrice);

  if (!Number.isFinite(q) || q <= 0) return res.status(400).json({ error: "quantity must be > 0" });
  if (!Number.isFinite(p) || p <= 0) return res.status(400).json({ error: "avgBuyPrice must be > 0" });

  const holding = await Holding.create({
    userId: req.user.userId,
    assetRefId: assetRefId || null,
    type,
    symbol: symbol.trim(),
    name: String(name || "").trim(),
    quantity: Number(quantity),
    avgBuyPrice: Number(avgBuyPrice),
  });

  res.status(201).json({ ok: true, holding });
}

export async function deleteHolding(req, res) {
  const { id } = req.params;

  const deleted = await Holding.findOneAndDelete({ _id: id, userId: req.user.userId });
  if (!deleted) return res.status(404).json({ error: "Holding not found" });

  res.json({ ok: true });
}
