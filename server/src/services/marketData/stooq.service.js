function parseCsv(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const idx = {
    date: headers.indexOf("date"),
    open: headers.indexOf("open"),
    high: headers.indexOf("high"),
    low: headers.indexOf("low"),
    close: headers.indexOf("close"),
    volume: headers.indexOf("volume"),
  };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[idx.date];
    if (!date) continue;

    rows.push({
      date,
      open: idx.open >= 0 ? Number(cols[idx.open]) : null,
      high: idx.high >= 0 ? Number(cols[idx.high]) : null,
      low: idx.low >= 0 ? Number(cols[idx.low]) : null,
      close: Number(cols[idx.close]),
      volume: idx.volume >= 0 ? Number(cols[idx.volume]) : null,
    });
  }
  return rows.filter((r) => Number.isFinite(r.close));
}

export async function fetchStooqDailyHistory(stooqSymbol) {
  // Stooq daily CSV endpoint:
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Stooq fetch failed (${res.status})`);
  const csv = await res.text();
  return parseCsv(csv);
}

export async function fetchStooqLatest(stooqSymbol) {
  const rows = await fetchStooqDailyHistory(stooqSymbol);
  if (!rows.length) throw new Error("No Stooq data");
  return rows[rows.length - 1]; // last row is latest
}
