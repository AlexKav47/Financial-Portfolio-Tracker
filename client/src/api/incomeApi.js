import { apiJson } from "./fetchClient";

export async function listIncome({ type, q } = {}) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (q) params.set("q", q);

  const qs = params.toString();
  return apiJson(`/api/income${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function createIncome(payload) {
  return apiJson("/api/income", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteIncome(id) {
  return apiJson(`/api/income/${id}`, { method: "DELETE" });
}

export async function getIncomeSummary() {
  return apiJson("/api/income/summary", { method: "GET" });
}

