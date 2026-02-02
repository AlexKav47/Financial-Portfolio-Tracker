import { AssetMaster } from "../models/AssetMaster.js";

export async function searchAssets(req, res) {
  const type = String(req.query.type || "").trim();
  const q = String(req.query.q || "").trim();

  if (!["stock", "crypto"].includes(type)) {
    return res.status(400).json({ error: "type must be stock or crypto" });
  }
  if (!q) {
    return res.json({ ok: true, results: [] });
  }

  // Simple search
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const results = await AssetMaster.find({
    type,
    $or: [{ symbol: regex }, { name: regex }],
  })
    .select("type symbol name providerIds")
    .limit(10)
    .lean();

  res.json({ ok: true, results });
}
