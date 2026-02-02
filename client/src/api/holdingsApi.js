import { apiJson } from "./fetchClient";

export async function listHoldings() {
  return apiJson("/api/holdings", { method: "GET" });
}

export async function createHolding(payload) {
  return apiJson("/api/holdings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteHolding(id) {
  return apiJson(`/api/holdings/${id}`, { method: "DELETE" });
}
