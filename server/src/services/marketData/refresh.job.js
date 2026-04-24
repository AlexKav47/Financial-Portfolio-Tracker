import axios from "axios";
import { parse } from "csv-parse/sync";
import { Holding } from "../../models/Holding.js";
import { AssetMaster } from "../../models/AssetMaster.js";
import { PriceHistory } from "../../models/PriceHistory.js";
import { LatestPrice } from "../../models/LatestPrice.js";
import { fetchYahooCryptoDailyHistory } from "./yahooCrypto.service.js";

/**
 * What this service guarantees:
 * - When you refresh an asset, you upsert its daily rows into PriceHistory.
 * - You upsert the latest close into LatestPrice.
 * - Stocks keep the last 30 TRADING days (30 newest rows).
 * - Crypto keeps the last 30 CALENDAR days (date window).
 */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toNum(v) {
  if (v == null) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function toISODate(dateStr) {
  const s = String(dateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function isoMinusDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * Stooq daily CSV endpoint.
 */
function stooqCsvUrl(stooqSymbol, daysBack) {
  const today = new Date();
  const d2 = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  const past = new Date(today);
  past.setDate(today.getDate() - daysBack);
  const d1 = past.toISOString().slice(0, 10).replace(/-/g, "");

  return `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d&d1=${d1}&d2=${d2}`;
}

function parseStooqDailyCsv(csvText) {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records
    .map((r) => {
      const date = toISODate(r.Date ?? r.DATE ?? r.date);
      const open = toNum(r.Open ?? r.OPEN ?? r.open);
      const high = toNum(r.High ?? r.HIGH ?? r.high);
      const low = toNum(r.Low ?? r.LOW ?? r.low);
      const close = toNum(r.Close ?? r.CLOSE ?? r.close);
      const volume = toNum(r.Volume ?? r.VOLUME ?? r.volume);

      if (!date || close == null) return null;
      return { date, open, high, low, close, volume };
    })
    .filter(Boolean);
}

function sortByDateAsc(rows) {
  return rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function buildPriceHistoryOps(asset, rows, source, currency) {
  return rows.map((r) => ({
    updateOne: {
      filter: { assetRefId: asset._id, date: r.date },
      update: {
        $setOnInsert: {
          assetRefId: asset._id,
          type: asset.type,
          symbol: asset.symbol,
          date: r.date,
          source,
          currency,
        },
        $set: {
          open: r.open ?? null,
          high: r.high ?? null,
          low: r.low ?? null,
          close: r.close,
          volume: r.volume ?? null,
        },
      },
      upsert: true,
    },
  }));
}

function buildLatestPriceOp(asset, latestRow, source, currency) {
  const asOf = new Date(`${latestRow.date}T00:00:00Z`);

  return {
    updateOne: {
      filter: { assetRefId: asset._id },
      update: {
        $set: {
          assetRefId: asset._id,
          type: asset.type,
          symbol: asset.symbol,
          currency,
          price: latestRow.close,
          asOf,
          source,
        },
      },
      upsert: true,
    },
  };
}

/**
 * Keep last N CALENDAR days (rolling window).
 * Because date is stored as "YYYY-MM-DD", string compare works for $lt.
 */
async function prunePriceHistoryByDays(assetId, latestIsoDate, keepDays = 30) {
  const cutoff = isoMinusDays(latestIsoDate, keepDays);
  if (!cutoff) return;

  await PriceHistory.deleteMany({
    assetRefId: assetId,
    date: { $lt: cutoff },
  });
}

/**
 * Keep last N rows (best if you mean 30 TRADING days for stocks).
 */
async function prunePriceHistoryByCount(assetId, keepCount = 30) {
  const docs = await PriceHistory.find({ assetRefId: assetId })
    .sort({ date: -1 })
    .skip(keepCount)
    .select({ _id: 1 })
    .lean();

  if (docs.length) {
    await PriceHistory.deleteMany({ _id: { $in: docs.map((d) => d._id) } });
  }
}

/**
 * Stocks:
 * - Fetch enough CALENDAR days to cover at least 30 trading days 
 * - After upsert, prune to 30 newest rows
 *
 * Crypto:
 * - Fetch last 30 calendar days
 * - After upsert, prune by date window
 */
export async function refreshSingleAsset(
  assetRefId,
  {
    stockCalendarBackfillDays = 70, 
    cryptoCalendarBackfillDays = 30,
  } = {}
) {
  const asset = await AssetMaster.findById(assetRefId).lean();
  if (!asset) throw new Error("AssetMaster not found for assetRefId");

  let rows = [];
  let source = "";
  let currency = "USD";

  if (asset.type === "stock") {
    const stooqSymbol = asset.providerIds?.stooqSymbol;
    if (!stooqSymbol) throw new Error("Missing providerIds.stooqSymbol");

    const url = stooqCsvUrl(stooqSymbol, stockCalendarBackfillDays);

    const resp = await axios.get(url, {
      responseType: "text",
      timeout: 30_000,
      headers: { "User-Agent": "FinancialPortfolioTracker/1.0" },
    });

    rows = parseStooqDailyCsv(resp.data);
    if (!rows.length) throw new Error("Stooq CSV parsed but no rows");

    source = "stooq";
    currency = "USD";
  } else if (asset.type === "crypto") {
    const yahooSymbol = asset.providerIds?.yahooSymbol;
    if (!yahooSymbol) throw new Error("Missing providerIds.yahooSymbol (e.g. BTC-USD)");

    rows = await fetchYahooCryptoDailyHistory(yahooSymbol);
    if (!rows.length) throw new Error("Yahoo history returned no rows");

    source = "Yahoo"; // keep schema enum consistent
    currency = "USD";
  } else {
    throw new Error(`Unsupported asset type: ${asset.type}`);
  }

  sortByDateAsc(rows);
  const latest = rows[rows.length - 1];

  // Upsert history
  const phOps = buildPriceHistoryOps(asset, rows, source, currency);
  if (phOps.length) await PriceHistory.bulkWrite(phOps, { ordered: false });

  // Upsert latest
  await LatestPrice.bulkWrite([buildLatestPriceOp(asset, latest, source, currency)], {
    ordered: false,
  });

  
  // Stocks: keep 30 TRADING days 
  // Crypto: keep 30 CALENDAR days
  if (asset.type === "stock") {
    await prunePriceHistoryByCount(asset._id, 30);
  } else {
    await prunePriceHistoryByDays(asset._id, latest.date, 30);
  }

  return {
    assetRefId: asset._id,
    symbol: asset.symbol,
    type: asset.type,
    latestDate: latest.date,
    fetchedRows: rows.length,
    pruned: asset.type === "stock" ? "keepCount=30" : "keepDays=30",
    source,
    currency,
  };
}

/**
 * Refresh ALL owned assets 
 */
export async function refreshOwnedAssetsBatch({
  sleepMs = 1000,
  stockCalendarBackfillDays = 70,
  cryptoCalendarBackfillDays = 30,
} = {}) {
  const assetRefIds = await Holding.distinct("assetRefId", { assetRefId: { $ne: null } });

  if (!assetRefIds.length) {
    return { ok: 0, fail: 0, total: 0, note: "No owned assets (assetRefId missing in holdings)" };
  }

  let ok = 0;
  let fail = 0;

  for (const assetRefId of assetRefIds) {
    try {
      await refreshSingleAsset(assetRefId, {
        stockCalendarBackfillDays,
        cryptoCalendarBackfillDays,
      });
      ok++;
    } catch (e) {
      fail++;
      console.error(`[batch-refresh] ${assetRefId} failed -> ${e.message}`);
    }

    if (sleepMs > 0) await sleep(sleepMs);
  }

  return {
    ok,
    fail,
    total: assetRefIds.length,
    stockCalendarBackfillDays,
    cryptoCalendarBackfillDays,
  };
}
