const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://46.224.237.210:4000";

async function doFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  return res;
}

export async function apiFetch(path, options = {}) {
  let res = await doFetch(path, options);

  if (res.status !== 401) return res;

  // Try refresh once
  const refreshRes = await doFetch("/api/auth/refresh", { method: "POST" });

  if (!refreshRes.ok) {
    // Refresh failed caller should redirect to login
    return res;
  }

  // Retry original request once
  res = await doFetch(path, options);
  return res;
}

export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return { res, data };
}
