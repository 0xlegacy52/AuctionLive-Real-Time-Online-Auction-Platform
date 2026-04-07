const BASE_URL = "/api";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string; displayName: string }) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { username: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
  },
  auctions: {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request(`/auctions${query}`);
    },
    get: (id: number) => request(`/auctions/${id}`),
    create: (data: any) => request("/auctions", { method: "POST", body: JSON.stringify(data) }),
    endingSoon: () => request("/auctions/ending-soon"),
    myAuctions: () => request("/auctions/user/my-auctions"),
    myBids: () => request("/auctions/user/my-bids"),
    checkWatchlist: (id: number) => request(`/auctions/${id}/watchlist`),
    toggleWatchlist: (id: number) => request(`/auctions/${id}/watchlist`, { method: "POST" }),
  },
  bids: {
    place: (auctionId: number, amount: number) =>
      request(`/bids/${auctionId}`, { method: "POST", body: JSON.stringify({ amount }) }),
    setAutoBid: (auctionId: number, maxBid: number) =>
      request(`/bids/${auctionId}/auto-bid`, { method: "POST", body: JSON.stringify({ maxBid }) }),
  },
};
