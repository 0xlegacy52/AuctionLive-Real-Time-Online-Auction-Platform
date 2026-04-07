import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import AuctionCard from "../components/AuctionCard";
import { CATEGORIES, CONDITIONS } from "../../../shared/types";

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category") || "";
  const condition = searchParams.get("condition") || "";
  const sort = searchParams.get("sort") || "endTime";

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), sort };
    if (category) params.category = category;
    if (condition) params.condition = condition;
    if (search) params.search = search;
    if (sort === "currentPrice") params.order = "asc";
    else if (sort === "bidCount") params.order = "desc";

    api.auctions.list(params).then((data) => {
      setAuctions(data.auctions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, category, condition, sort, searchParams]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", search);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Auctions</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search auctions..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="flex flex-wrap gap-3">
          <select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={condition}
            onChange={(e) => updateParam("condition", e.target.value)}
            className="input-field w-auto"
          >
            <option value="">Any Condition</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="input-field w-auto"
          >
            <option value="endTime">Ending Soonest</option>
            <option value="createdAt">Newest First</option>
            <option value="currentPrice">Price: Low to High</option>
            <option value="bidCount">Most Bids</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : auctions.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} auction{total !== 1 ? "s" : ""} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParam("page", String(p))}
                  className={`w-10 h-10 rounded-lg font-medium ${
                    p === page ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No auctions found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
