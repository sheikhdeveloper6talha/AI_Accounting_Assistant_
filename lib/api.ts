export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ai-accounting-assistant-bixl.onrender.com";


async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
 if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Agar server se reply aaya hai (jaise 429 wala message) toh wahi error banayein
    throw new Error(body.reply || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listEntries: (query: string) => request<any>(`/api/entries?${query}`),
  createEntry: (payload: any) => request<any>("/api/entries", { method: "POST", body: JSON.stringify(payload) }),
  updateEntry: (id: string, payload: any) => request<any>(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteEntry: (id: string) => request<any>(`/api/entries/${id}`, { method: "DELETE" }),
  chat: (message: string, history: any[]) => request<any>("/api/ai-chat", { method: "POST", body: JSON.stringify({ message, history }) }),
  pl: (month?: string) => request<any>(`/api/reports/pl${month ? `?month=${month}` : ""}`),
  balanceSheet: () => request<any>("/api/reports/balance-sheet"),
  audit: (month?: string) => request<any>(`/api/reports/audit${month ? `?month=${month}` : ""}`),
};
