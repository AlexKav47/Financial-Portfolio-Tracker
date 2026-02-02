import { apiJson } from "./fetchClient";

export async function getLatestPriceByAssetId(assetId) {
  const params = new URLSearchParams({ assetId });
  return apiJson(`/api/prices/latest?${params.toString()}`, { method: "GET" });
}
