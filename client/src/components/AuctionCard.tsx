import { Link } from "react-router-dom";
import CountdownTimer from "./CountdownTimer";

interface Props {
  auction: {
    id: number;
    title: string;
    currentPrice: number;
    startingPrice: number;
    imageUrls: string[];
    status: string;
    endTime: string;
    bidCount: number;
    category: string;
    condition: string;
    seller?: { displayName: string; rating: number };
  };
}

export default function AuctionCard({ auction }: Props) {
  const isActive = auction.status === "active";

  return (
    <Link to={`/auction/${auction.id}`} className="card overflow-hidden group">
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {auction.imageUrls.length > 0 ? (
          <img
            src={auction.imageUrls[0]}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
            {auction.category}
          </span>
          {auction.condition !== "New" && (
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-500">
              {auction.condition}
            </span>
          )}
        </div>
        {isActive && (
          <div className="absolute bottom-2 right-2">
            <div className="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
              <CountdownTimer endTime={auction.endTime} size="sm" />
            </div>
          </div>
        )}
        {!isActive && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            auction.status === "sold" ? "bg-green-900/40" : "bg-gray-900/40"
          }`}>
            <span className={`px-4 py-2 rounded-lg font-bold text-lg uppercase ${
              auction.status === "sold" ? "bg-green-600 text-white" : "bg-gray-600 text-white"
            }`}>
              {auction.status === "sold" ? "Sold" : "Ended"}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
          {auction.title}
        </h3>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">
              {auction.bidCount > 0 ? "Current Bid" : "Starting Price"}
            </p>
            <p className="text-xl font-bold text-gray-900">
              ${auction.currentPrice.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {auction.seller && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              by {auction.seller.displayName}
            </span>
            {auction.seller.rating > 0 && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-gray-500">{auction.seller.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
