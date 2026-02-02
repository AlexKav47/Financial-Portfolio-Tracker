import { Holding } from "../models/Holding.js";
import { LatestPrice } from "../models/LatestPrice.js";

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function summary(req, res) {
  const userId = req.user.userId;

  const holdings = await Holding.find({ userId }).lean();

  const assetIds = holdings
    .map((h) => h.assetRefId)
    .filter(Boolean)
    .map((id) => String(id));

  const latestDocs = assetIds.length
    ? await LatestPrice.find({ assetRefId: { $in: assetIds } }).lean()
    : [];

  const latestByAssetId = new Map(latestDocs.map((d) => [String(d.assetRefId), d]));

  // Per-holding computed rows
  const computed = holdings.map((h) => {
    const qty = Number(h.quantity) || 0;
    const avg = Number(h.avgBuyPrice) || 0;

    const invested = qty * avg;

    const key = h.assetRefId ? String(h.assetRefId) : null;
    const latest = key ? latestByAssetId.get(key) : null;
    const mktPrice =
      latest?.price != null && Number.isFinite(Number(latest.price)) ? Number(latest.price) : null;

    // Market-based price with fallback to avgBuyPrice
    const usedPrice = mktPrice != null ? mktPrice : avg;
    const currentValue = qty * usedPrice;

    const gain = currentValue - invested;

    return {
      _id: String(h._id),
      assetRefId: h.assetRefId ? String(h.assetRefId) : null,
      type: h.type, // "stock" | "crypto"
      symbol: h.symbol,
      name: h.name || "",
      currency: "USD", // for now
      quantity: round2(qty),
      avgBuyPrice: round2(avg),
      invested: round2(invested),
      currentValue: round2(currentValue),
      gain: round2(gain),
      hasLatest: !!mktPrice,
      latestPrice: mktPrice != null ? round2(mktPrice) : null,
      latestAsOf: latest?.asOf || null,
      latestSource: latest?.source || null,
    };
  });

  // Portfolio totals
  const totalValue = computed.reduce((sum, r) => sum + r.currentValue, 0);
  const totalInvested = computed.reduce((sum, r) => sum + r.invested, 0);
  const totalProfit = computed.reduce((sum, r) => sum + r.gain, 0);

  // Share % per holding (big table rows)
  const holdingsRows = computed
    .map((r) => {
      const sharePct = totalValue > 0 ? (r.currentValue / totalValue) * 100 : 0;
      return {
        key: r._id,
        type: r.type,
        symbol: r.symbol,
        name: r.name,
        currency: r.symbol, // matches your screenshot “Currency” column
        balance: r.quantity,
        avgPrice: r.avgBuyPrice,
        costBasis: r.invested,
        currentValue: r.currentValue,
        totalProfit: r.gain,
        sharePct: round2(sharePct),
      };
    })
    .sort((a, b) => b.currentValue - a.currentValue);

  // Grouped (Stocks vs Crypto) - keep this for the right-side summary table
  const groupAgg = {
    stock: { invested: 0, value: 0, gain: 0 },
    crypto: { invested: 0, value: 0, gain: 0 },
  };

  for (const r of computed) {
    const g = r.type === "crypto" ? "crypto" : "stock";
    groupAgg[g].invested += r.invested;
    groupAgg[g].value += r.currentValue;
    groupAgg[g].gain += r.gain;
  }

  const stocksAllocationPct = totalValue > 0 ? (groupAgg.stock.value / totalValue) * 100 : 0;
  const cryptoAllocationPct = totalValue > 0 ? (groupAgg.crypto.value / totalValue) * 100 : 0;

  // Allocation for donut (PER ASSET)
  // Prevent an unreadable donut if user holds lots of assets
  const TOP_N = 12;

  const perAssetSorted = computed
    .map((r) => ({
      symbol: r.symbol,
      name: r.name || r.symbol,
      type: r.type,
      value: r.currentValue,
    }))
    .sort((a, b) => b.value - a.value);

  const allocationRaw = perAssetSorted.map((a) => ({
    name: a.symbol,          // short label for chart slices
    fullName: a.name,        // optional: for tooltip on client
    type: a.type,
    value: round2(a.value),
    pct: totalValue > 0 ? round2((a.value / totalValue) * 100) : 0,
  }));

  let allocation = allocationRaw;

  if (allocationRaw.length > TOP_N) {
    const top = allocationRaw.slice(0, TOP_N);
    const rest = allocationRaw.slice(TOP_N);
    const otherValue = rest.reduce((s, x) => s + (Number(x.value) || 0), 0);

    top.push({
      name: "Other",
      fullName: "Other",
      type: "mixed",
      value: round2(otherValue),
      pct: totalValue > 0 ? round2((otherValue / totalValue) * 100) : 0,
    });

    allocation = top;
  }

  res.json({
    ok: true,

    kpis: {
      value: round2(totalValue),
      totalProfit: round2(totalProfit),
      irr: null,
      passiveIncome: null,
    },

    groups: {
      stocks: {
        invested: round2(groupAgg.stock.invested),
        value: round2(groupAgg.stock.value),
        gain: round2(groupAgg.stock.gain),
        allocationPct: round2(stocksAllocationPct),
      },
      crypto: {
        invested: round2(groupAgg.crypto.invested),
        value: round2(groupAgg.crypto.value),
        gain: round2(groupAgg.crypto.gain),
        allocationPct: round2(cryptoAllocationPct),
      },
      total: {
        invested: round2(totalInvested),
        value: round2(totalValue),
        gain: round2(totalProfit),
      },
    },

    allocation, // now PER ASSET (top N + Other)
    holdings: holdingsRows,

    meta: {
      valuationMode: "market_based",
      holdingCount: holdings.length,
      allocationMode: "per_asset",
      allocationTopN: TOP_N,
    },
  });
}
