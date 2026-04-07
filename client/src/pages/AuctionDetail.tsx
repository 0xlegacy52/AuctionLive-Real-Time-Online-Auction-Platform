import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { getSocket, joinAuction, leaveAuction } from "../lib/socket";
import { calculateMinIncrement } from "../../../shared/types";
import CountdownTimer from "../components/CountdownTimer";
import BidHistory from "../components/BidHistory";

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [maxAutoBid, setMaxAutoBid] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [showAutoBid, setShowAutoBid] = useState(false);
  const [bidFlash, setBidFlash] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const auctionId = parseInt(id || "0");

  const loadAuction = useCallback(async () => {
    try {
      const data = await api.auctions.get(auctionId);
      setAuction(data);
      setBids(data.bids || []);

      const minBid = data.bidCount === 0
        ? data.startingPrice
        : data.currentPrice + calculateMinIncrement(data.currentPrice);
      setBidAmount(minBid.toFixed(2));
    } catch (error) {
      console.error("Failed to load auction:", error);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    loadAuction();

    if (user) {
      api.auctions.checkWatchlist(auctionId).then((d) => setWatching(d.watching)).catch(() => {});
    }

    joinAuction(auctionId);
    const socket = getSocket();

    socket.on("new_bid", (data: any) => {
      setAuction((prev: any) => prev ? {
        ...prev,
        currentPrice: data.currentPrice,
        bidCount: data.bidCount,
        endTime: data.endTime,
        currentWinnerId: data.currentWinnerId,
      } : prev);

      setBids((prev) => [data.bid, ...prev]);

      const minBid = data.currentPrice + calculateMinIncrement(data.currentPrice);
      setBidAmount(minBid.toFixed(2));

      setBidFlash(true);
      setTimeout(() => setBidFlash(false), 500);
    });

    socket.on("countdown_sync", (data: any) => {
      if (data.auctionId === auctionId) {
        setAuction((prev: any) => prev ? { ...prev, endTime: data.endTime } : prev);
      }
    });

    socket.on("auction_ended", (data: any) => {
      if (data.auctionId === auctionId) {
        setAuction((prev: any) => prev ? { ...prev, status: data.status } : prev);
      }
    });

    return () => {
      leaveAuction(auctionId);
      socket.off("new_bid");
      socket.off("countdown_sync");
      socket.off("auction_ended");
    };
  }, [auctionId, loadAuction, user]);

  const handleBid = async () => {
    if (!user) return setBidError("Please sign in to bid");
    setBidError("");
    setBidLoading(true);
    try {
      await api.bids.place(auctionId, parseFloat(bidAmount));
    } catch (err: any) {
      setBidError(err.message);
    } finally {
      setBidLoading(false);
    }
  };

  const handleAutoBid = async () => {
    if (!user) return setBidError("Please sign in to bid");
    setBidError("");
    setBidLoading(true);
    try {
      await api.bids.setAutoBid(auctionId, parseFloat(maxAutoBid));
      setShowAutoBid(false);
      setMaxAutoBid("");
    } catch (err: any) {
      setBidError(err.message);
    } finally {
      setBidLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user || !auction?.buyNowPrice) return;
    setBidError("");
    setBidLoading(true);
    try {
      await api.bids.place(auctionId, auction.buyNowPrice);
    } catch (err: any) {
      setBidError(err.message);
    } finally {
      setBidLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!user) return;
    try {
      const data = await api.auctions.toggleWatchlist(auctionId);
      setWatching(data.watching);
    } catch (err) {
      console.error("Watchlist error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Auction not found</h2>
        <Link to="/browse" className="btn-primary mt-4 inline-block">Browse Auctions</Link>
      </div>
    );
  }

  const isActive = auction.status === "active";
  const isSeller = user?.id === auction.sellerId;
  const isWinning = user?.id === auction.currentWinnerId;
  const minBid = auction.bidCount === 0
    ? auction.startingPrice
    : auction.currentPrice + calculateMinIncrement(auction.currentPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
            {auction.imageUrls.length > 0 ? (
              <img
                src={auction.imageUrls[selectedImage]}
                alt={auction.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {auction.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {auction.imageUrls.map((url: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    i === selectedImage ? "border-primary-500" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-sm text-gray-500 font-medium">{auction.category}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-sm text-gray-500">{auction.condition}</span>
            </div>
            {user && (
              <button onClick={toggleWatchlist} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className={`w-6 h-6 ${watching ? "text-red-500 fill-current" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{auction.title}</h1>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold">
                {auction.seller.displayName[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{auction.seller.displayName}</p>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-gray-500">
                  {auction.seller.rating.toFixed(1)} ({auction.seller.ratingCount})
                </span>
              </div>
            </div>
          </div>

          <div className={`card p-6 mb-6 ${bidFlash ? "animate-bid-flash" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 uppercase font-medium">
                  {auction.bidCount > 0 ? "Current Bid" : "Starting Price"}
                </p>
                <p className="text-4xl font-bold text-gray-900">${auction.currentPrice.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{auction.bidCount} bids</p>
                <p className="text-sm text-gray-500">{auction.viewCount} views</p>
              </div>
            </div>

            {auction.reservePrice && auction.bidCount > 0 && (
              <div className={`text-sm mb-3 ${
                auction.currentPrice >= auction.reservePrice
                  ? "text-green-600"
                  : "text-orange-600"
              }`}>
                {auction.currentPrice >= auction.reservePrice
                  ? "Reserve price met"
                  : "Reserve price not yet met"}
              </div>
            )}

            {isActive && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500 mb-1">Time Remaining</p>
                <CountdownTimer endTime={auction.endTime} size="lg" />
              </div>
            )}

            {!isActive && (
              <div className={`border-t border-gray-100 pt-4 text-center ${
                auction.status === "sold" ? "text-green-600" : "text-gray-600"
              }`}>
                <p className="text-lg font-bold uppercase">
                  {auction.status === "sold" ? "Sold!" : "Auction Ended"}
                </p>
              </div>
            )}
          </div>

          {isActive && !isSeller && (
            <div className="card p-6 mb-6 space-y-4">
              {isWinning && (
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                  You're the highest bidder!
                </div>
              )}

              {bidError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{bidError}</div>
              )}

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Bid (min: ${minBid.toFixed(2)})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="input-field pl-7"
                      min={minBid}
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleBid}
                    disabled={bidLoading || !user}
                    className="btn-primary px-6 py-2.5"
                  >
                    {bidLoading ? "..." : "Place Bid"}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                {auction.buyNowPrice && (
                  <button
                    onClick={handleBuyNow}
                    disabled={bidLoading || !user}
                    className="btn-success flex-1"
                  >
                    Buy Now — ${auction.buyNowPrice.toFixed(2)}
                  </button>
                )}
                <button
                  onClick={() => setShowAutoBid(!showAutoBid)}
                  className="btn-secondary flex-1"
                >
                  {showAutoBid ? "Cancel" : "Auto-Bid"}
                </button>
              </div>

              {showAutoBid && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <p className="text-sm text-gray-600">
                    Set your maximum and we'll automatically bid for you up to that amount.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={maxAutoBid}
                        onChange={(e) => setMaxAutoBid(e.target.value)}
                        className="input-field pl-7"
                        placeholder="Max bid amount"
                        min={minBid}
                        step="0.01"
                      />
                    </div>
                    <button onClick={handleAutoBid} disabled={bidLoading} className="btn-primary">
                      Set Auto-Bid
                    </button>
                  </div>
                </div>
              )}

              {!user && (
                <p className="text-center text-sm text-gray-500">
                  <Link to="/login" className="text-primary-600 font-medium">Sign in</Link> to place a bid
                </p>
              )}
            </div>
          )}

          {auction.shippingMethod && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>{auction.shippingMethod} — ${auction.shippingCost.toFixed(2)}</span>
            </div>
          )}

          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{auction.description}</p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bid History</h3>
            <BidHistory bids={bids} />
          </div>
        </div>
      </div>
    </div>
  );
}
