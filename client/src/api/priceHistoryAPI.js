export async function getLastPriceHistory(assetRefId, limit = 30) {
  const res = await fetch(`/api/price-history/${assetRefId}?limit=${limit}`);
  const data = await res.json().catch(() => null);
  return { res, data };
}
