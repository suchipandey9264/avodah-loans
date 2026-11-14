// Client for the AvodahLoans backend (../backend). In dev, Vite proxies /api to http://localhost:4000.
// In production set VITE_API_URL to the deployed API origin (e.g. https://api.avodahloans.com).

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";
const TOKEN_KEY = "avodah.token";

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
};

// 502/503/504 or a refused connection mean the request never reached the API (e.g. it is restarting),
// so it is safe to retry — even a POST. Waits ~0.5s, 1s, 2s, 3s between attempts.
const UNREACHABLE = new Set([502, 503, 504]);
const RETRY_DELAYS = [500, 1000, 2000, 3000];
const UNAVAILABLE_MSG = "Our server is temporarily unavailable. Please try again in a moment.";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(path, { method = "GET", body, query } = {}) {
  const qs = query ? "?" + new URLSearchParams(query) : "";
  const token = getToken();
  const init = {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  let res;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(BASE + path + qs, init);
      if (!UNREACHABLE.has(res.status) || attempt >= RETRY_DELAYS.length) break;
    } catch {
      if (attempt >= RETRY_DELAYS.length) throw Object.assign(new Error(UNAVAILABLE_MSG), { status: 0 });
    }
    await wait(RETRY_DELAYS[attempt]);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallback = UNREACHABLE.has(res.status) ? UNAVAILABLE_MSG : `Request failed (${res.status})`;
    // `fields` maps field names to the server's validation messages (see backend/src/lib/validate.js).
    throw Object.assign(new Error(data.error ?? fallback), { status: res.status, fields: data.fields ?? {} });
  }
  return data;
}

export const api = {
  // Catalogue
  loanTypes: () => request("/loan-types"),
  lenders: (query) => request("/lenders", { query }),
  lender: (id) => request(`/lenders/${encodeURIComponent(id)}`),
  offers: ({ type, amount, tenure, annualIncome }) => request("/offers", { query: { type, amount, tenure, income: annualIncome } }),
  emi: (principal, rate, months) => request("/emi", { method: "POST", body: { principal, rate, months } }),

  // Auth
  /** contact = { phone } or { email }, plus captchaToken when captcha is on */
  sendOtp: (contact) => request("/auth/otp", { method: "POST", body: contact }),
  async verifyOtp(contact, otp, name) {
    const out = await request("/auth/verify", { method: "POST", body: { ...contact, otp, name } });
    setToken(out.token);
    return out.user;
  },
  me: () => request("/auth/me"),
  async logout() {
    try { await request("/auth/logout", { method: "POST" }); } finally { setToken(null); }
  },

  // Dashboard
  activity: () => request("/me/activity"),
  syncActivity: (activity) => request("/me/activity", { method: "PUT", body: activity }),
  /** list: "searches" | "saved" | "compares" | "credit" | "callbacks" */
  logActivity: (list, item) => request(`/me/activity/${list}`, { method: "POST", body: item }),
  updateProfile: (profile) => request("/me/profile", { method: "PATCH", body: profile }),
  apply: (offer) => request("/applications", { method: "POST", body: offer }),
  applications: () => request("/applications"),

  // Lead forms
  requestCallback: (lead) => request("/leads/callback", { method: "POST", body: lead }),
  requestCreditReport: (lead) => request("/leads/credit-report", { method: "POST", body: lead }),
};
