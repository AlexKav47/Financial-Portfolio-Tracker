import axios from "axios";
import { parse } from "csv-parse/sync";
import { Holding } from "../../models/Holding.js";
import { AssetMaster } from "../../models/AssetMaster.js";
import { PriceHistory } from "../../models/PriceHistory.js";
import { LatestPrice } from "../../models/LatestPrice.js";
import { fetchYahooCryptoDailyHistory } from "./yahooCrypto.service.js";

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

// Stooq daily CSV endpoint, US stocks are typically <ticker>.us contentReference[oaicite:3]{index=3}
function stooqCsvUrl(stooqSymbol) {
  return `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
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
 * Batch refresh:
 * - Only assets that are actually owned (distinct assetRefId in holdings)
 * - Stocks: download Stooq CSV, parse with csv-parse
 * - Crypto: fetch Yahoo chart daily history, normalize
 * - bulkWrite to PriceHistory and LatestPrice
 * - 1 second sleep between assets
 */
export async function refreshOwnedAssetsBatch({ sleepMs = 1000 } = {}) {
  // Only assets users actually own
  const assetRefIds = await Holding.distinct("assetRefId", {
    assetRefId: { $ne: null },
  });

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

        const url = stooqCsvUrl(stooqSymbol);
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
        source = "yahoo";
        currency = "USD";
      } else {
        throw new Error(`Unsupported asset type: ${asset.type}`);
      }

      rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      const latest = rows[rows.length - 1];

      // Bulk upsert PriceHistory
      const phOps = buildPriceHistoryOps(asset, rows, source, currency);
      if (phOps.length) {
        await PriceHistory.bulkWrite(phOps, { ordered: false });
      }

      // Bulk upsert LatestPrice
      await LatestPrice.bulkWrite([buildLatestPriceOp(asset, latest, source, currency)], {
        ordered: false,
      });

      ok++;
    } catch (e) {
      fail++;
      console.error(`[batch-refresh] ${asset.type}:${asset.symbol} failed -> ${e.message}`);
    }

    // Sleep between assets to reduce blocking
    if (sleepMs > 0) await sleep(sleepMs);
  }

  return { ok, fail, total: assets.length };
}
