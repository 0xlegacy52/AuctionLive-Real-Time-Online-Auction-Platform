interface BidItem {
  id: number;
  amount: number;
  isAutoBid: boolean;
  bidder: string | { username: string; displayName: string };
  createdAt: string;
}

interface Props {
  bids: BidItem[];
}

function maskName(name: string): string {
  if (name.length <= 2) return name[0] + "***";
  return name[0] + "***" + name[name.length - 1];
}

export default function BidHistory({ bids }: Props) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No bids yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {bids.map((bid, idx) => {
        const bidderName = typeof bid.bidder === "string" ? bid.bidder : maskName(bid.bidder.username);
        const time = new Date(bid.createdAt);

        return (
          <div
            key={bid.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              idx === 0 ? "bg-green-50 border border-green-200" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                {idx === 0 ? "1st" : `#${idx + 1}`}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {bidderName}
                  {bid.isAutoBid && (
                    <span className="ml-1.5 text-xs text-gray-400 font-normal">(auto)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {time.toLocaleTimeString()} - {time.toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`font-bold ${idx === 0 ? "text-green-700 text-lg" : "text-gray-700"}`}>
              ${bid.amount.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
