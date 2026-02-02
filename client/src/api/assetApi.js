import { apiJson } from "./fetchClient";

export async function searchAssets(type, q) {
  const params = new URLSearchParams({ type, q });
  return apiJson(`/api/assets/search?${params.toString()}`, { method: "GET" });
}
