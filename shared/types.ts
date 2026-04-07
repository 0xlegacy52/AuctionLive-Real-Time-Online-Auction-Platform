export interface AuctionData {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  startingPrice: number;
  reservePrice: number | null;
  buyNowPrice: number | null;
  currentPrice: number;
  minIncrement: number;
  shippingCost: number;
  shippingMethod: string | null;
  imageUrls: string[];
  status: string;
  startTime: string;
  endTime: string;
  originalEndTime: string;
  bidCount: number;
  viewCount: number;
  sellerId: number;
  currentWinnerId: number | null;
  seller?: { id: number; username: string; displayName: string; rating: number };
}

export interface BidData {
  id: number;
  amount: number;
  isAutoBid: boolean;
  auctionId: number;
  bidderId: number;
  bidder?: { username: string; displayName: string };
  createdAt: string;
}

export interface UserData {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  rating: number;
  ratingCount: number;
}

export type AuctionStatus = "active" | "ended" | "sold" | "unsold" | "cancelled";
export type AuctionCondition = "New" | "Like New" | "Used" | "For Parts";
export type AuctionDuration = "1h" | "3h" | "12h" | "24h" | "3d" | "7d";

export const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Collectibles",
  "Sports",
  "Toys & Games",
  "Art",
  "Vehicles",
  "Jewelry",
  "Other",
] as const;

export const CONDITIONS: AuctionCondition[] = ["New", "Like New", "Used", "For Parts"];

export const DURATIONS: { label: string; value: AuctionDuration; ms: number }[] = [
  { label: "1 Hour", value: "1h", ms: 3600000 },
  { label: "3 Hours", value: "3h", ms: 10800000 },
  { label: "12 Hours", value: "12h", ms: 43200000 },
  { label: "24 Hours", value: "24h", ms: 86400000 },
  { label: "3 Days", value: "3d", ms: 259200000 },
  { label: "7 Days", value: "7d", ms: 604800000 },
];

export function calculateMinIncrement(currentPrice: number): number {
  if (currentPrice < 10) return 0.5;
  if (currentPrice < 50) return 1;
  if (currentPrice < 100) return 2;
  if (currentPrice < 500) return 5;
  if (currentPrice < 1000) return 10;
  if (currentPrice < 5000) return 25;
  return 50;
}

export function maskUsername(username: string): string {
  if (username.length <= 2) return username[0] + "***";
  return username[0] + "***" + username[username.length - 1];
}
