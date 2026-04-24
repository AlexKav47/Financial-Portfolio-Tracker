import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { load } from "cheerio"; 
import { connectDb } from "../config/db.js";
import { AssetMaster } from "../models/AssetMaster.js";

// Helper for Stooq Symbol format
function toStooqSymbol(usTicker) {
  return `${usTicker.replaceAll(".", "-").toLowerCase()}.us`;
}

async function fetchSp100Tickers() {
  const url = "https://en.wikipedia.org/wiki/S%26P_100";
  console.log("Fetching S&P 100 from Wikipedia...");

  try {
    const response = await axios.get(url, { 
      timeout: 30_000,
      headers: {
        'User-Agent': 'FinancialTrackerProject/1.0 (Contact: my-email@example.com)'
      }
    });

    const html = response.data;
    const $ = load(html); 

    const tables = $("table.wikitable");
    let found = [];

    tables.each((_, table) => {
      const headers = $(table)
        .find("tr")
        .first()
        .find("th")
        .map((i, th) => $(th).text().trim().toLowerCase())
        .get();

      if (headers.includes("symbol") && headers.includes("name")) {
        const rows = $(table).find("tr").slice(1);
        rows.each((__, tr) => {
          const tds = $(tr).find("td");
          if (tds.length < 2) return;

          const symbol = $(tds[0]).text().trim();
          const name = $(tds[1]).text().trim();
          if (!symbol || !name) return;

          found.push({ symbol, name });
        });
      }
    });

    const map = new Map();
    for (const x of found) map.set(x.symbol, x);
    return Array.from(map.values());
  } catch (err) {
    console.error("Wikipedia Fetch Error:", err.message);
    return [];
  }
}

async function fetchTop100Crypto() {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
  console.log("Fetching Top 100 Crypto from CoinGecko...");

  try {
    const response = await axios.get(url, { timeout: 30_000 });
    const data = response.data;

    return (data || []).map((c) => ({
      symbol: String(c.symbol || "").toUpperCase(),
      name: String(c.name || "").trim(),
    }));
  } catch (err) {
    console.error("CoinGecko Fetch Error", err.message);
    return [];
  }
}

async function upsertAssets(assets) {
  let upserts = 0;
  for (const a of assets) {
    const r = await AssetMaster.updateOne(
      { type: a.type, symbol: a.symbol },
      { $set: a },
      { upsert: true }
    );
    if (r.upsertedCount || r.modifiedCount) upserts++;
  }
  return upserts;
}

async function run() {
  await connectDb();

  // Stocks
  const sp = await fetchSp100Tickers();
  const spLimited = sp.slice(0, 100);

  const stockDocs = spLimited.map((x) => ({
    type: "stock",
    symbol: x.symbol,
    name: x.name,
    providerIds: {
      stooqSymbol: toStooqSymbol(x.symbol),
      // URL for 24-hour CSV job
      csvUrl: `https://stooq.com/q/d/l/?s=${toStooqSymbol(x.symbol)}&i=d`
    },
  }));

  // Crypto
  const cg = await fetchTop100Crypto();
  const cryptoDocs = cg.map((x) => ({
    type: "crypto",
    symbol: x.symbol,
    name: x.name,
    providerIds: {
      // Yahoo mapping for 24-hour CSV job
      yahooSymbol: `${x.symbol}-USD`,
      csvUrl: `https://query1.finance.yahoo.com/v7/finance/download/${x.symbol}-USD?interval=1d&events=history`
    },
  }));

  const up1 = await upsertAssets(stockDocs);
  const up2 = await upsertAssets(cryptoDocs);

  console.log(`Seed complete!`);
  console.log(`Stocks processed: ${up1}`);
  console.log(`Crypto processed: ${up2}`);
  process.exit(0);
}

run().catch((e) => {
  console.error("Run failed:", e);
  process.exit(1);
});