import { parse } from "csv-parse/sync";

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

function parseCsv(csvText) {
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

function stooqCsvUrl(stooqSymbol, daysBack) {
  if (!daysBack) {
    return `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
  }

  const today = new Date();
  const d2 = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  const past = new Date(today);
  past.setDate(today.getDate() - daysBack);
  const d1 = past.toISOString().slice(0, 10).replace(/-/g, "");

  return `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d&d1=${d1}&d2=${d2}`;
}

// daysBack = calendar days to fetch (use 70 to reliably cover 30 trading days)
export async function fetchStooqDailyHistory(stooqSymbol, daysBack = 70) {
  const url = stooqCsvUrl(stooqSymbol, daysBack);

  const res = await fetch(url, {
    headers: { "User-Agent": "FinancialPortfolioTracker/1.0" },
  });
  if (!res.ok) throw new Error(`Stooq fetch failed (${res.status})`);

  const csv = await res.text();
  const rows = parseCsv(csv);

  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return rows;
}

export async function fetchStooqLatest(stooqSymbol) {
  const rows = await fetchStooqDailyHistory(stooqSymbol, 70);
  if (!rows.length) throw new Error("No Stooq data");
  return rows[rows.length - 1];
}
