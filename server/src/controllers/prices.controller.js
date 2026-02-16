import axios from "axios";
import { parse } from "csv-parse/sync";
import { AssetMaster } from "../models/AssetMaster.js";
import { LatestPrice } from "../models/LatestPrice.js";

function isFresh(asOf, maxAgeMs = 24 * 60 * 60 * 1000) {
  if (!asOf) return false;
  return Date.now() - new Date(asOf).getTime() < maxAgeMs;
}

function toISODateFromUnixSeconds(sec) {
  const d = new Date(sec * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function stooqCsvUrl(stooqSymbol) {
  return `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
}

function parseStooqDailyCsv(csvText) {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const rows = records
    .map((r) => {
      const date = String(r.Date ?? r.date ?? "").trim();
      const close = Number(r.Close ?? r.close);
      if (!date || !Number.isFinite(close)) return null;
      return { date, close };
    })
    .filter(Boolean);

  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return rows;
}

async function fetchYahooLatestClose(yahooSymbol) {
  // Yahoo returns arrays of OHLC
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?interval=1d&range=10d`;

  const res = await axios.get(url, {
    timeout: 30_000,
    headers: { "User-Agent": "FinancialPortfolioTracker/1.0" },
  });

  const result = res.data?.chart?.result?.[0];
  if (!result) throw new Error("Yahoo chart result missing");

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0];
  if (!timestamps.length || !quote?.close?.length) throw new Error("Yahoo chart missing data");

  // Find the last non null close
  for (let i = timestamps.length - 1; i >= 0; i--) {
    const close = quote.close[i];
    if (close != null && Number.isFinite(Number(close))) {
      const date = toISODateFromUnixSeconds(timestamps[i]);
      return { date, close: Number(close) };
    }
  }

  throw new Error("Yahoo returned no valid close values");
}

export async function getLatestPrice(req, res) {
  const assetId = req.query.assetId ? String(req.query.assetId) : null;
  if (!assetId) return res.status(400).json({ error: "assetId is required" });

  const asset = await AssetMaster.findById(assetId).lean();
  if (!asset) return res.status(404).json({ error: "Asset not found" });

  // Cache hit
  const cached = await LatestPrice.findOne({ assetRefId: asset._id }).lean();
  if (cached && isFresh(cached.asOf)) {
    return res.json({ ok: true, latest: cached, source: "cache" });
  }

  // Live fetch once then cache
  try {
    let latestRow;
    let source = "stooq";
    let currency = "USD";

    if (asset.type === "stock") {
      const stooqSymbol = asset.providerIds?.stooqSymbol;
      if (!stooqSymbol) return res.status(400).json({ error: "Asset missing stooqSymbol" });

      const csv = (
        await axios.get(stooqCsvUrl(stooqSymbol), {
          responseType: "text",
          timeout: 30_000,
          headers: { "User-Agent": "FinancialPortfolioTracker/1.0" },
        })
      ).data;

      const rows = parseStooqDailyCsv(csv);
      if (!rows.length) throw new Error("Stooq CSV empty");
      latestRow = rows[rows.length - 1];
      source = "stooq";
      currency = "USD";
    } else if (asset.type === "crypto") {
      const yahooSymbol = asset.providerIds?.yahooSymbol;
      if (!yahooSymbol) {
        return res.status(400).json({ error: "Asset missing yahooSymbol (e.g. XRP-USD)" });
      }

      latestRow = await fetchYahooLatestClose(yahooSymbol);
      source = "yahoo";
      currency = "USD";
    } else {
      return res.status(400).json({ error: "Unsupported asset type" });
    }

    const asOf = new Date(`${latestRow.date}T00:00:00Z`);

    const doc = await LatestPrice.findOneAndUpdate(
      { assetRefId: asset._id },
      {
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
      { upsert: true, new: true }
    ).lean();

    return res.json({ ok: true, latest: doc, source: "live" });
  } catch (e) {
    return res.status(502).json({ error: `Price fetch failed: ${e.message}` });
  }
}
