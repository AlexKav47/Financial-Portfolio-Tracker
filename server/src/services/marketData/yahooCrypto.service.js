import axios from "axios";

function toISODateFromUnixSeconds(sec) {
  const d = new Date(sec * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Fetch daily OHLCV from Yahoo Finance chart endpoint for crypto tickers like BTC-USD.
 * We use range=max and interval=1d to get full daily history.
 *
 * Output rows: { date, open, high, low, close, volume }
 */
export async function fetchYahooCryptoDailyHistory(yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?interval=1d&range=5d`;

  const res = await axios.get(url, {
    timeout: 30_000,
    headers: { "User-Agent": "FinancialPortfolioTracker/1.0" },
  });

  const result = res.data?.chart?.result?.[0];
  if (!result) throw new Error("Yahoo chart result missing");

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0];

  if (!timestamps.length || !quote) throw new Error("Yahoo chart missing timestamps/quote");

  const rows = [];
  for (let i = 0; i < timestamps.length; i++) {
    const date = toISODateFromUnixSeconds(timestamps[i]);
    const open = quote.open?.[i] ?? null;
    const high = quote.high?.[i] ?? null;
    const low = quote.low?.[i] ?? null;
    const close = quote.close?.[i] ?? null;
    const volume = quote.volume?.[i] ?? null;

    if (close == null) continue;

    rows.push({
      date,
      open: Number.isFinite(open) ? Number(open) : null,
      high: Number.isFinite(high) ? Number(high) : null,
      low: Number.isFinite(low) ? Number(low) : null,
      close: Number(close),
      volume: Number.isFinite(volume) ? Number(volume) : null,
    });
  }

  // ensure chronological
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return rows;
}
