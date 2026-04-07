import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AuctionCard from "../components/AuctionCard";

export default function MyAuctions() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auctions.myAuctions().then(setAuctions).catch(console.error).finally(() => setLoading(false));
  }, []);

  const active = auctions.filter((a) => a.status === "active");
  const ended = auctions.filter((a) => a.status !== "active");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Auctions</h1>
        <Link to="/create" className="btn-primary">Create Auction</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No auctions yet</h3>
          <p className="text-gray-500 mb-4">Create your first auction and start selling!</p>
          <Link to="/create" className="btn-primary">Create Auction</Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active ({active.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {active.map((a) => <AuctionCard key={a.id} auction={a} />)}
              </div>
            </section>
          )}
          {ended.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ended ({ended.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {ended.map((a) => <AuctionCard key={a.id} auction={a} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
