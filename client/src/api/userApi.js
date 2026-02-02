import { apiJson } from "./fetchClient";

export async function getMe() {
  return apiJson("/api/user/me", { method: "GET" });
}
