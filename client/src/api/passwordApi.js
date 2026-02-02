import { apiJson } from "./fetchClient";

export async function changePassword(payload) {
  return apiJson("/api/password/change", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
