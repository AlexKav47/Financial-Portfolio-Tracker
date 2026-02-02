function toISODate(ms) {
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function fetchCoingeckoDailyHistory(coingeckoId, vsCurrency = "usd", days = "max") {
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
    coingeckoId
  )}/market_chart?vs_currency=${encodeURIComponent(vsCurrency)}&days=${encodeURIComponent(days)}`;

  const res = await fetch(url, {
    headers: {
      "accept": "application/json",
    },
  });

  if (!res.ok) throw new Error(`CoinGecko fetch failed (${res.status})`);

  const data = await res.json();
  // data.prices = timestampMs, price
  // normalize to one entry per date (keep last price of each date)
  const map = new Map();
  for (const [ts, price] of data.prices || []) {
    const date = toISODate(ts);
    map.set(date, Number(price));
  }

  const rows = [];
  for (const [date, close] of map.entries()) {
    if (Number.isFinite(close)) rows.push({ date, close });
  }

  rows.sort((a, b) => (a.date < b.date ? -1 : 1));
  return rows;
}

export async function fetchCoingeckoLatest(coingeckoId, vsCurrency = "usd") {
  const rows = await fetchCoingeckoDailyHistory(coingeckoId, vsCurrency, 7);
  if (!rows.length) throw new Error("No CoinGecko data");
  return rows[rows.length - 1];
}
