import { apiJson } from "./fetchClient";

export async function register(email, password) {
  return apiJson("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
}

export async function login(email, password) {
  return apiJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
}

export async function logout() {
  return apiJson("/api/auth/logout", { method: "POST",
    credentials: "include"
  });
}
