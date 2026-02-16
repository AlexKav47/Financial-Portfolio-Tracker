import { IncomeEntry } from "../models/IncomeEntry.js";

function parseType(type) {
  if (!type) return null;
  const t = String(type).toLowerCase();
  if (t === "dividend" || t === "staking") return t;
  return null;
}

export async function listIncome(req, res) {
  const userId = req.user.userId;

  const type = parseType(req.query.type);
  const q = (req.query.q || "").toString().trim();

  const filter = { userId };
  if (type) filter.type = type;

  const entries = await IncomeEntry.find(filter).sort({ date: -1, createdAt: -1 }).lean();

  res.json({ ok: true, entries });
}

export async function createIncome(req, res) {
  const userId = req.user.userId;

  const { type, symbol, network, date, amount, currency, assetRefId } = req.body || {};

  const t = parseType(type);
  if (!t) return res.status(400).json({ error: "Invalid type. Must be dividend or staking." });

  const sym = String(symbol || "").trim().toUpperCase();
  if (!sym) return res.status(400).json({ error: "symbol is required" });

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: "amount must be > 0" });

  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return res.status(400).json({ error: "date is invalid" });

  const cur = currency ? String(currency).trim().toUpperCase() : "USD";
  if (!/^[A-Z]{3}$/.test(cur)) return res.status(400).json({ error: "currency must be a 3-letter code" });

  const net = t === "staking" ? String(network || "").trim() : "";
  if (t === "staking" && !net) return res.status(400).json({ error: "network is required for staking entries" });

  const doc = await IncomeEntry.create({
    userId,
    type: t,
    assetRefId: assetRefId || null,
    symbol: sym,
    network: net,
    date: d,
    amount: amt,
    currency: cur,
  });

  res.status(201).json({ ok: true, entry: doc });
}

export async function deleteIncome(req, res) {
  const userId = req.user.userId;
  const id = req.params.id;

  const before = await IncomeEntry.findOne({ _id: id, userId }).lean();
  if (!before) return res.status(404).json({ error: "Income entry not found" });

  const result = await IncomeEntry.deleteOne({ _id: id, userId });

  const after = await IncomeEntry.findOne({ _id: id, userId }).lean();

  return res.json({
    ok: true,
    deletedCount: result.deletedCount,
    stillExistsAfterDelete: Boolean(after),
    db: IncomeEntry.db?.name,
    collection: IncomeEntry.collection?.name,
  });
}


export async function incomeSummary(req, res) {
  const userId = req.user.userId;

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  const startOfMonth = new Date(`${yyyy}-${mm}-01T00:00:00.000Z`);
  const startOfYear = new Date(`${yyyy}-01-01T00:00:00.000Z`);

  const [monthDocs, ytdDocs] = await Promise.all([
    IncomeEntry.find({ userId, date: { $gte: startOfMonth } }).select("amount type").lean(),
    IncomeEntry.find({ userId, date: { $gte: startOfYear } }).select("amount type").lean(),
  ]);

  const sum = (arr) => arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const sumType = (arr, type) => sum(arr.filter((x) => x.type === type));

  res.json({
    ok: true,
    month: {
      total: sum(monthDocs),
      dividends: sumType(monthDocs, "dividend"),
      staking: sumType(monthDocs, "staking"),
    },
    ytd: {
      total: sum(ytdDocs),
      dividends: sumType(ytdDocs, "dividend"),
      staking: sumType(ytdDocs, "staking"),
    },
  });
}