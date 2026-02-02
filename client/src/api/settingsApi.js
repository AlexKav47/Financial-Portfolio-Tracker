import { apiJson } from "./fetchClient";

export async function getMySettings() {
  return apiJson("/api/settings/me", { method: "GET" });
}

export async function updateMySettings(payload) {
  return apiJson("/api/settings/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
