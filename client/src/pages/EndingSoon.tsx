import { useEffect, useState } from "react";
import { api } from "../lib/api";
import AuctionCard from "../components/AuctionCard";

export default function EndingSoon() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auctions.endingSoon().then(setAuctions).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <h1 className="text-3xl font-bold text-gray-900">Ending Soon</h1>
      </div>
      <p className="text-gray-600 mb-8">Auctions ending within the next hour. Don't miss out!</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : auctions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No auctions ending soon</h3>
          <p className="text-gray-500">Check back later for time-critical auctions</p>
        </div>
      )}
    </div>
  );
}
