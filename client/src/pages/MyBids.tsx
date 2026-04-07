import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CountdownTimer from "../components/CountdownTimer";
import { api } from "../lib/api";

export default function MyBids() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auctions.myBids().then(setAuctions).catch(console.error).finally(() => setLoading(false));
  }, []);

  const active = auctions.filter((a) => a.status === "active");
  const won = auctions.filter((a) => a.status === "sold" && a.isWinning);
  const lost = auctions.filter((a) => (a.status === "sold" || a.status === "unsold") && !a.isWinning);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bids</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No bids yet</h3>
          <p className="text-gray-500 mb-4">Find something to bid on!</p>
          <Link to="/browse" className="btn-primary">Browse Auctions</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Bids ({active.length})</h2>
              <div className="space-y-3">
                {active.map((a) => (
                  <Link key={a.id} to={`/auction/${a.id}`} className="card p-4 flex items-center justify-between hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {a.imageUrls?.[0] ? (
                          <img src={a.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{a.title}</h3>
                        <p className="text-sm text-gray-500">
                          Your bid: ${a.myHighestBid?.toFixed(2)} |{" "}
                          Current: ${a.currentPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-medium mb-1 ${a.isWinning ? "text-green-600" : "text-orange-600"}`}>
                        {a.isWinning ? "Winning" : "Outbid"}
                      </div>
                      <CountdownTimer endTime={a.endTime} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {won.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Won ({won.length})</h2>
              <div className="space-y-3">
                {won.map((a) => (
                  <Link key={a.id} to={`/auction/${a.id}`} className="card p-4 flex items-center justify-between hover:shadow-md border-l-4 border-green-500">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {a.imageUrls?.[0] ? (
                          <img src={a.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{a.title}</h3>
                        <p className="text-sm text-green-600 font-medium">Won for ${a.currentPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {lost.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ended ({lost.length})</h2>
              <div className="space-y-3">
                {lost.map((a) => (
                  <Link key={a.id} to={`/auction/${a.id}`} className="card p-4 flex items-center justify-between hover:shadow-md opacity-75">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {a.imageUrls?.[0] ? (
                          <img src={a.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{a.title}</h3>
                        <p className="text-sm text-gray-500">Final: ${a.currentPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
