import axios from "axios";
import { parse } from "csv-parse/sync";
import { Holding } from "../../models/Holding.js";
import { AssetMaster } from "../../models/AssetMaster.js";
import { PriceHistory } from "../../models/PriceHistory.js";
import { LatestPrice } from "../../models/LatestPrice.js";
import { fetchYahooCryptoDailyHistory } from "./yahooCrypto.service.js";

/**
 * Refresh owned assets:
 * - Only refresh assets actually owned (distinct assetRefId in holdings)
 * - Stocks: fetch Stooq daily CSV over a configurable backfill window
 * - Crypto: fetch Yahoo daily history over a configurable backfill window
 * - Upsert into PriceHistory (per-day unique constraint) and LatestPrice
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

/**
 * Stooq daily CSV endpoint.
 * NOTE: daysBack is CALENDAR days. Stocks will only include trading days.
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

function buildPriceHistoryOps(asset, rows, source, currency) {
  return rows.map((r) => ({
    updateOne: {
      filter: { assetRefId: asset._id, date: r.date },
      update: {
        // immutable fields only on first insert
        $setOnInsert: {
          assetRefId: asset._id,
          type: asset.type,
          symbol: asset.symbol,
          date: r.date,
          source,
          currency,
        },
        // price fields can be refreshed without conflict
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
  // treat as-of as midnight UTC of the trading/day bar
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

function sortByDateAsc(rows) {
  return rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Batch refresh owned assets
 *
 * Options:
 * - sleepMs: throttle between assets
 * - stockCalendarBackfillDays: calendar-day window to fetch from Stooq
 *   (use ~45 calendar days to get ~30 US trading days)
 * - cryptoCalendarBackfillDays: calendar-day window to fetch from Yahoo for crypto
 */
export async function refreshOwnedAssetsBatch({
  sleepMs = 1000,
  stockCalendarBackfillDays = 45, // ~30 trading days
  cryptoCalendarBackfillDays = 30, // crypto trades daily
} = {}) {
  const assetRefIds = await Holding.distinct("assetRefId", { assetRefId: { $ne: null } });

  if (!assetRefIds.length) {
    return { ok: 0, fail: 0, total: 0, note: "No owned assets (assetRefId missing in holdings)" };
  }

  const assets = await AssetMaster.find({ _id: { $in: assetRefIds } }).lean();

  let ok = 0;
  let fail = 0;

  for (const asset of assets) {
    try {
      let rows = [];
      let source = "";
      let currency = "USD";

      if (asset.type === "stock") {
        const stooqSymbol = asset.providerIds?.stooqSymbol;
        if (!stooqSymbol) throw new Error("Missing providerIds.stooqSymbol");

        // IMPORTANT CHANGE: fetch a bigger window so DB has enough history
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

        // RECOMMENDED: update fetchYahooCryptoDailyHistory to accept daysBack.
        // Backward-compatible: if your function ignores the 2nd arg, it won't break.
        rows = await fetchYahooCryptoDailyHistory(yahooSymbol, cryptoCalendarBackfillDays);
        if (!rows.length) throw new Error("Yahoo history returned no rows");

        // IMPORTANT: match your Mongoose enum ("Yahoo" not "yahoo") unless you change the schema enum.
        source = "Yahoo";
        currency = "USD";
      } else {
        throw new Error(`Unsupported asset type: ${asset.type}`);
      }

      sortByDateAsc(rows);
      const latest = rows[rows.length - 1];

      // Upsert PriceHistory
      const phOps = buildPriceHistoryOps(asset, rows, source, currency);
      if (phOps.length) {
        await PriceHistory.bulkWrite(phOps, { ordered: false });
      }

      // Upsert LatestPrice
      await LatestPrice.bulkWrite([buildLatestPriceOp(asset, latest, source, currency)], {
        ordered: false,
      });

      ok++;
    } catch (e) {
      fail++;
      console.error(`[batch-refresh] ${asset?.type || "?"}:${asset?.symbol || "?"} failed -> ${e.message}`);
    }

    if (sleepMs > 0) await sleep(sleepMs);
  }

  return {
    ok,
    fail,
    total: assets.length,
    stockCalendarBackfillDays,
    cryptoCalendarBackfillDays,
  };
}
