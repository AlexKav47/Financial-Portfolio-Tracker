import { apiJson } from "./fetchClient";

export async function getDashboardSummary() {
  return apiJson("/api/dashboard/summary", { method: "GET" });
}
