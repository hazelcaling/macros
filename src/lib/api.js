const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/$/, "");

async function http(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    let msg;
    try { msg = await res.text(); } catch { msg = res.statusText; }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  list: () => http("/macros"),
  create: (item) => http("/macros", { method: "POST", body: JSON.stringify(item) }),
  update: (id, item) => http(`/macros/${id}`, { method: "PUT", body: JSON.stringify(item) }),
  remove: (id) => http(`/macros/${id}`, { method: "DELETE" }),
};
